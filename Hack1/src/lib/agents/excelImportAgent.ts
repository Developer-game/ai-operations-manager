import * as XLSX from 'xlsx';
import { sanitizeNoEmDash } from '@/lib/sanitizer';
import { store } from '@/lib/store';

export interface StagedMemberRow {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
  teamName: string;
  status: 'valid' | 'warning' | 'error';
  issue?: string;
}

export interface ExcelImportPreview {
  fileName: string;
  fileSize: number;
  detectedColumns: Record<string, string>;
  members: StagedMemberRow[];
  rolesToCreate: string[];
  teamsToCreate: string[];
  validCount: number;
  errorCount: number;
}

/**
 * Parses an uploaded file (.xlsx, .xls, .csv), checks file size & type,
 * extracts raw records, maps columns via heuristic/AI rules, and flags validation issues.
 */
export async function parseSpreadsheetFile(
  orgId: string,
  file: File
): Promise<ExcelImportPreview> {
  // 1. Validate file size (max 5MB)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('The file is larger than 5 MB. Please upload a smaller spreadsheet.');
  }

  // 2. Validate file type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
    throw new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
  }

  // 3. Read buffer
  let workbook: XLSX.WorkBook;
  try {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (err: any) {
    throw new Error('Could not read the spreadsheet. The file may be corrupt or encrypted.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The spreadsheet contains no sheets or data.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The spreadsheet appears to be empty. Please add rows before importing.');
  }

  return processRawSpreadsheetData(orgId, file.name, file.size, rawRows);
}

/**
 * Processes raw rows into structured staged records with column mapping and problem diagnosis.
 */
export function processRawSpreadsheetData(
  orgId: string,
  fileName: string,
  fileSize: number,
  rows: Array<Record<string, unknown>>
): ExcelImportPreview {
  const sample = rows[0] || {};
  const keys = Object.keys(sample);
  const detectedColumns: Record<string, string> = {};

  // Intelligent column header detection
  keys.forEach((k) => {
    const lower = k.toLowerCase().trim();
    if (lower.includes('name') || lower.includes('student') || lower.includes('full')) {
      detectedColumns[k] = 'fullName';
    } else if (lower.includes('mail') || lower.includes('address')) {
      detectedColumns[k] = 'email';
    } else if (lower.includes('role') || lower.includes('position') || lower.includes('title')) {
      detectedColumns[k] = 'roleName';
    } else if (lower.includes('team') || lower.includes('group') || lower.includes('division') || lower.includes('subteam')) {
      detectedColumns[k] = 'teamName';
    }
  });

  const existingRoles = store.getRoles(orgId);
  const existingRoleNames = existingRoles.map((r) => r.name.toLowerCase());
  const existingTeams = store.getTeams(orgId);
  const existingTeamNames = existingTeams.map((t) => t.name.toLowerCase());

  // Existing emails in this society
  const existingMembers = store.getMembersAndInvites(orgId);
  const existingEmailSet = new Set(existingMembers.map((m) => m.user.email.toLowerCase()));

  const seenInSpreadsheetEmails = new Set<string>();
  const rolesToCreateSet = new Set<string>();
  const teamsToCreateSet = new Set<string>();

  let validCount = 0;
  let errorCount = 0;

  const members: StagedMemberRow[] = rows.map((row, index) => {
    let fullName = '';
    let email = '';
    let roleName = 'Member';
    let teamName = '';

    Object.entries(row).forEach(([col, val]) => {
      const field = detectedColumns[col];
      const strVal = String(val ?? '').trim();
      if (field === 'fullName') fullName = strVal;
      else if (field === 'email') email = strVal.toLowerCase();
      else if (field === 'roleName' && strVal) roleName = strVal;
      else if (field === 'teamName' && strVal) teamName = strVal;
    });

    let status: StagedMemberRow['status'] = 'valid';
    let issue: string | undefined = undefined;

    if (!email) {
      status = 'error';
      issue = 'Missing email address';
      errorCount++;
    } else if (!email.includes('@') || !email.includes('.')) {
      status = 'error';
      issue = 'Invalid email syntax';
      errorCount++;
    } else if (seenInSpreadsheetEmails.has(email)) {
      status = 'error';
      issue = 'Duplicate email in this spreadsheet';
      errorCount++;
    } else if (existingEmailSet.has(email)) {
      status = 'warning';
      issue = 'Already an active or invited member';
      validCount++; // Allowed to review / skip
    } else {
      validCount++;
    }

    if (email) {
      seenInSpreadsheetEmails.add(email);
    }

    if (roleName && !existingRoleNames.includes(roleName.toLowerCase())) {
      rolesToCreateSet.add(roleName);
      if (!issue) {
        issue = `New role "${roleName}" will be created`;
        status = 'warning';
      }
    }

    if (teamName && !existingTeamNames.includes(teamName.toLowerCase())) {
      teamsToCreateSet.add(teamName);
    }

    return {
      id: `staged-${index + 1}`,
      fullName: sanitizeNoEmDash(fullName || email.split('@')[0].replace('.', ' ')),
      email: email,
      roleName: sanitizeNoEmDash(roleName),
      teamName: sanitizeNoEmDash(teamName),
      status,
      issue: issue ? sanitizeNoEmDash(issue) : undefined,
    };
  });

  return {
    fileName,
    fileSize,
    detectedColumns,
    members,
    rolesToCreate: Array.from(rolesToCreateSet),
    teamsToCreate: Array.from(teamsToCreateSet),
    validCount,
    errorCount,
  };
}

/**
 * Transactionally commits staged members to the organisation dashboard.
 * Nothing is saved until the organiser explicitly clicks IMPORT.
 */
export function commitSpreadsheetImport(
  orgId: string,
  stagedMembers: StagedMemberRow[]
): { addedCount: number; skippedCount: number } {
  let addedCount = 0;
  let skippedCount = 0;

  const roleMap = new Map<string, string>();
  const teamMap = new Map<string, string>();

  store.getRoles(orgId).forEach((r) => roleMap.set(r.name.toLowerCase(), r.id));
  store.getTeams(orgId).forEach((t) => teamMap.set(t.name.toLowerCase(), t.id));

  // Existing members set
  const existingMembers = store.getMembersAndInvites(orgId);
  const existingEmailSet = new Set(existingMembers.map((m) => m.user.email.toLowerCase()));

  // Process rows
  stagedMembers.forEach((m) => {
    // Skip if row has an invalid email error or already exists
    if (m.status === 'error' || !m.email) {
      skippedCount++;
      return;
    }

    if (existingEmailSet.has(m.email.toLowerCase())) {
      skippedCount++;
      return;
    }

    // Role check or create
    const roleKey = (m.roleName || 'Member').toLowerCase();
    let roleId = roleMap.get(roleKey);
    if (!roleId) {
      const newRole = store.createRole(
        orgId,
        m.roleName || 'Member',
        10,
        ['members.view', 'availability.view']
      );
      roleId = newRole.id;
      roleMap.set(roleKey, roleId);
    }

    // Team check or create
    let teamId: string | undefined = undefined;
    if (m.teamName) {
      const teamKey = m.teamName.toLowerCase();
      teamId = teamMap.get(teamKey);
      if (!teamId) {
        const newTeam = store.createTeam(orgId, m.teamName);
        teamId = newTeam.id;
        teamMap.set(teamKey, teamId);
      }
    }

    // Register invitation
    const res = store.createInvitation(orgId, m.email, roleId, teamId);
    if (res.success) {
      existingEmailSet.add(m.email.toLowerCase());
      addedCount++;
    } else {
      skippedCount++;
    }
  });

  return { addedCount, skippedCount };
}
