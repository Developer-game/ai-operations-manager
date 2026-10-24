'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { AppShell } from '@/components/AppShell';
import { SanitizedText } from '@/components/SanitizedText';
import {
  parseSpreadsheetFile,
  commitSpreadsheetImport,
  ExcelImportPreview,
} from '@/lib/agents/excelImportAgent';
import { hasPermission } from '@/lib/permissions';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  UploadCloud,
  X,
  Search,
  Crown,
  CheckSquare,
  Trash2,
  Calendar,
  Lock,
  Loader2,
  Clock,
  UserCheck,
  Plus,
  Edit2,
  SlidersHorizontal,
  ChevronRight,
  FolderPlus,
  MoreVertical,
  Check,
} from 'lucide-react';
import { Role, Team, Task } from '@/types';

export default function MembersDirectoryPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();

  // Permission checking
  const canViewAllMembers = currentOrg && currentUser ? store.canUserViewMembers(currentUser.id, currentOrg.id) : false;
  const canEditMembers = hasPermission(role, 'members.edit');

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'roster' | 'teams'>('roster');

  // Member list state (joined + invited)
  const [memberRoster, setMemberRoster] = useState(() => {
    return currentOrg ? store.getMembersAndInvites(currentOrg.id) : [];
  });

  // State refreshes
  const refreshData = () => {
    if (currentOrg) {
      setMemberRoster(store.getMembersAndInvites(currentOrg.id));
    }
  };

  // Manage Member Drawer / Modal state
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    user: { id: string; email: string; fullName: string };
    role?: Role;
    team?: Team;
    status: 'Joined' | 'Invited';
    joinedAt?: string;
    token?: string;
  } | null>(null);

  // Manage Member form states
  const [editRoleId, setEditRoleId] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [isTeamLeadCheck, setIsTeamLeadCheck] = useState(false);

  // New task assignment inside member drawer
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAssigningTask, setIsAssigningTask] = useState(false);

  // Manual Add Member Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Create Team Modal state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeadUserId, setNewTeamLeadUserId] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Spreadsheet Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentOrg || !currentUser) return null;

  const roles = store.getRoles(currentOrg.id);
  const teams = store.getTeams(currentOrg.id);
  const tasks = store.getTasks(currentOrg.id);

  // When opening member drawer, initialize fields
  const handleOpenMemberDrawer = (m: any) => {
    setSelectedMember(m);
    setEditRoleId(m.role?.id || roles[0]?.id || '');
    setEditTeamId(m.team?.id || '');
    setIsTeamLeadCheck(m.team?.leadUserId === m.user.id);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  // Save Role and Team changes
  const handleSaveMemberAssignments = () => {
    if (!selectedMember || !currentOrg) return;

    if (editRoleId && editRoleId !== selectedMember.role?.id) {
      store.updateMemberRole(currentOrg.id, selectedMember.user.id, editRoleId);
    }

    const teamToAssign = editTeamId === 'none' ? undefined : editTeamId;
    store.updateMemberTeam(currentOrg.id, selectedMember.user.id, teamToAssign, isTeamLeadCheck);

    toast.success(`Updated role and team assignments for ${selectedMember.user.fullName}`, 'Changes Saved');
    refreshData();
    // Update local selectedMember state
    const updatedRoster = store.getMembersAndInvites(currentOrg.id);
    const updated = updatedRoster.find((item) => item.user.id === selectedMember.user.id);
    if (updated) setSelectedMember(updated);
  };

  // Assign a new task directly to this member
  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newTaskTitle.trim() || !currentOrg) return;

    setIsAssigningTask(true);
    store.createTask({
      organisationId: currentOrg.id,
      assignedToUserId: selectedMember.user.id,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Assigned via Members Hub',
      dueDate: newTaskDueDate || undefined,
      priority: newTaskPriority,
      status: 'todo',
      createdByUserId: currentUser.id,
    });

    toast.success(`Task "${newTaskTitle.trim()}" assigned to ${selectedMember.user.fullName}`, 'Task Created');
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAssigningTask(false);
    refreshData();
  };

  // Toggle task status
  const handleToggleTaskStatus = (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    store.updateTaskStatus(task.id, nextStatus);
    toast.info(`Task marked as ${nextStatus === 'completed' ? 'completed' : 'todo'}`, 'Task Updated');
    refreshData();
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    store.deleteTask(taskId);
    toast.info('Task removed.', 'Task Deleted');
    refreshData();
  };

  // Remove member from society
  const handleRemoveMember = () => {
    if (!selectedMember || !currentOrg) return;
    if (confirm(`Are you sure you want to remove ${selectedMember.user.fullName} from ${currentOrg.name}?`)) {
      store.deleteMember(currentOrg.id, selectedMember.user.id);
      toast.success(`${selectedMember.user.fullName} removed from society`, 'Member Removed');
      setSelectedMember(null);
      refreshData();
    }
  };

  // Create new Team
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !currentOrg) return;

    setIsCreatingTeam(true);
    const team = store.createTeam(
      currentOrg.id,
      newTeamName.trim(),
      newTeamLeadUserId || undefined
    );

    // If a lead was chosen, ensure their membership points to this team
    if (newTeamLeadUserId) {
      store.updateMemberTeam(currentOrg.id, newTeamLeadUserId, team.id, true);
    }

    toast.success(`Team "${team.name}" established successfully!`, 'Team Created');
    setNewTeamName('');
    setNewTeamLeadUserId('');
    setShowCreateTeamModal(false);
    setIsCreatingTeam(false);
    refreshData();
  };

  // Delete team
  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (!currentOrg) return;
    if (confirm(`Delete team "${teamName}"? Members in this team will become unassigned.`)) {
      store.deleteTeam(currentOrg.id, teamId);
      toast.info(`Team "${teamName}" removed.`, 'Team Deleted');
      refreshData();
    }
  };

  // Manual Add Member
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newName.trim() || !newEmail.trim()) {
      setAddError('Name and university email are required.');
      return;
    }

    setIsAdding(true);
    const targetRoleId = newRoleId || roles[roles.length - 1]?.id || '';
    const targetTeamId = newTeamId === 'none' ? undefined : newTeamId;

    const res = store.createInvitation(
      currentOrg.id,
      newEmail.trim(),
      targetRoleId,
      targetTeamId
    );

    setIsAdding(false);
    if (!res.success) {
      setAddError(res.message);
      toast.error(res.message, 'Invitation Error');
    } else {
      toast.success(`Invitation dispatched to ${newEmail.trim()}`, 'Member Invited');
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      refreshData();
    }
  };

  // File parsing for spreadsheets
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setParseError('');

    try {
      const preview = await parseSpreadsheetFile(currentOrg.id, file);
      setImportPreview(preview);
    } catch {
      setParseError('Failed to parse spreadsheet file. Please verify CSV or Excel columns.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importPreview || !currentOrg) return;
    setIsImporting(true);

    try {
      const validMembers = importPreview.members.filter((m) => m.status !== 'error');
      const summary = commitSpreadsheetImport(currentOrg.id, validMembers);
      toast.success(`Successfully imported ${summary.addedCount} members (${summary.skippedCount} skipped)!`, 'Import Completed');
      setShowImportModal(false);
      setImportPreview(null);
      setImportFile(null);
      refreshData();
    } catch {
      setParseError('Failed to commit member import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return memberRoster.filter((m) => {
      // Search query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.user.fullName.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q) ||
        m.role?.name.toLowerCase().includes(q) ||
        m.team?.name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Team filter
      if (selectedTeamFilter !== 'all') {
        if (selectedTeamFilter === 'none' && m.team) return false;
        if (selectedTeamFilter === 'leads' && m.team?.leadUserId !== m.user.id) return false;
        if (selectedTeamFilter !== 'none' && selectedTeamFilter !== 'leads' && m.team?.id !== selectedTeamFilter) {
          return false;
        }
      }

      // Role filter
      if (selectedRoleFilter !== 'all') {
        if (m.role?.id !== selectedRoleFilter) return false;
      }

      return true;
    });
  }, [memberRoster, searchQuery, selectedTeamFilter, selectedRoleFilter]);

  // If normal member without permissions, show individual profile
  if (!canViewAllMembers) {
    const userTasks = tasks.filter((t) => t.assignedToUserId === currentUser.id);
    const userMembership = store.getMemberships().find(
      (m: any) => m.userId === currentUser.id && m.organisationId === currentOrg.id
    );
    const userRole = roles.find((r) => r.id === userMembership?.roleId);
    const userTeam = teams.find((t) => t.id === userMembership?.teamId);
    const teamLead = userTeam?.leadUserId
      ? store.getUsers().find((u) => u.id === userTeam.leadUserId)
      : null;

    return (
      <AppShell>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              My Society Profile
            </h1>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Member directory access is restricted to leadership roles. You can view your assigned team, role permissions, and active tasks below.
              </SanitizedText>
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{currentUser.fullName}</h2>
                <div style={{ fontSize: '0.84375rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="metric-tile-dense">
                <span className="metric-label">Assigned Role</span>
                <span className="metric-value" style={{ fontSize: '1.125rem', color: userRole?.color || 'var(--brand-primary)' }}>
                  {userRole?.name || 'Member'}
                </span>
              </div>
              <div className="metric-tile-dense">
                <span className="metric-label">Team</span>
                <span className="metric-value" style={{ fontSize: '1.125rem' }}>
                  {userTeam?.name || 'Unassigned'}
                </span>
              </div>
              <div className="metric-tile-dense">
                <span className="metric-label">Team Lead</span>
                <span className="metric-value" style={{ fontSize: '1.125rem' }}>
                  {teamLead?.fullName || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* User Tasks */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              My Assigned Tasks ({userTasks.length})
            </h3>
            {userTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84375rem' }}>
                You have no pending tasks assigned at this moment.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {userTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.description}</div>
                    </div>
                    <span
                      className="status-pill"
                      style={{
                        backgroundColor: t.status === 'completed' ? 'var(--badge-success-bg)' : 'var(--badge-warning-bg)',
                        color: t.status === 'completed' ? 'var(--badge-success-text)' : 'var(--badge-warning-text)',
                      }}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // Header Actions
  const headerActionButtons = canEditMembers && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={() => setShowCreateTeamModal(true)}
        className="btn btn-secondary"
        style={{ minHeight: '34px', padding: '0.3125rem 0.75rem', fontSize: '0.8125rem' }}
      >
        <FolderPlus size={14} color="var(--brand-primary)" />
        <span>Create Team</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setImportPreview(null);
          setParseError('');
          setShowImportModal(true);
        }}
        className="btn btn-secondary"
        style={{ minHeight: '34px', padding: '0.3125rem 0.75rem', fontSize: '0.8125rem' }}
      >
        <FileSpreadsheet size={14} />
        <span>Import</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setAddError('');
          setShowAddModal(true);
        }}
        className="btn btn-primary"
        style={{ minHeight: '34px', padding: '0.3125rem 0.75rem', fontSize: '0.8125rem' }}
      >
        <UserPlus size={14} />
        <span>Add Member</span>
      </button>
    </div>
  );

  return (
    <AppShell actions={headerActionButtons}>
      {/* Top Banner / Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="metric-tile-dense">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-label">Total Roster</span>
            <Users size={16} color="var(--brand-primary)" />
          </div>
          <div className="metric-value">{memberRoster.length}</div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
            {memberRoster.filter((m) => m.status === 'Joined').length} active, {memberRoster.filter((m) => m.status === 'Invited').length} invited
          </div>
        </div>

        <div className="metric-tile-dense">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-label">Teams</span>
            <Layers size={16} color="#06B6D4" />
          </div>
          <div className="metric-value">{teams.length}</div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
            {memberRoster.filter((m) => m.team).length} members assigned
          </div>
        </div>

        <div className="metric-tile-dense">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-label">Active Tasks</span>
            <CheckSquare size={16} color="#10B981" />
          </div>
          <div className="metric-value">{tasks.length}</div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
            {tasks.filter((t) => t.status !== 'completed').length} pending completion
          </div>
        </div>

        <div className="metric-tile-dense">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-label">Defined Roles</span>
            <Shield size={16} color="#8B5CF6" />
          </div>
          <div className="metric-value">{roles.length}</div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
            Full RBAC permission control
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Roster Table vs Teams Management */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1rem',
          paddingBottom: '0.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              fontSize: '0.84375rem',
              fontWeight: activeTab === 'roster' ? 600 : 500,
              color: activeTab === 'roster' ? 'var(--brand-primary-text)' : 'var(--text-muted)',
              borderBottom: activeTab === 'roster' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            <Users size={15} />
            <span>Member Directory ({filteredMembers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              fontSize: '0.84375rem',
              fontWeight: activeTab === 'teams' ? 600 : 500,
              color: activeTab === 'teams' ? 'var(--brand-primary-text)' : 'var(--text-muted)',
              borderBottom: activeTab === 'teams' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            <Layers size={15} />
            <span>Teams & Squads ({teams.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'roster' ? (
        <>
          {/* Practical Filters & Search Bar (Linear inspired) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '0.875rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Filter members, roles, emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '2rem',
                  minHeight: '34px',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('all')}
                className={`filter-chip ${selectedTeamFilter === 'all' ? 'active' : ''}`}
              >
                All Teams
              </button>

              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamFilter(t.id)}
                  className={`filter-chip ${selectedTeamFilter === t.id ? 'active' : ''}`}
                >
                  {t.name}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedTeamFilter('none')}
                className={`filter-chip ${selectedTeamFilter === 'none' ? 'active' : ''}`}
              >
                Unassigned
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeamFilter('leads')}
                className={`filter-chip ${selectedTeamFilter === 'leads' ? 'active' : ''}`}
              >
                <Crown size={12} color="#F59E0B" />
                <span>Leads Only</span>
              </button>
            </div>
          </div>

          {/* Searchable Data Table */}
          <div className="enterprise-table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Member</th>
                  <th style={{ width: '18%' }}>Role</th>
                  <th style={{ width: '18%' }}>Team</th>
                  <th style={{ width: '16%' }}>Assigned Tasks</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No members matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const memberTasks = tasks.filter((t) => t.assignedToUserId === m.user.id);
                    const pendingCount = memberTasks.filter((t) => t.status !== 'completed').length;
                    const isSelf = m.user.id === currentUser.id;

                    return (
                      <tr key={m.id}>
                        {/* Member Column */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: m.role?.color || 'var(--brand-primary)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                flexShrink: 0,
                              }}
                            >
                              {m.user.fullName.charAt(0) || 'M'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {m.user.fullName}
                                </span>
                                {isSelf && (
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.625rem',
                                      padding: '0.1rem 0.35rem',
                                      backgroundColor: 'var(--brand-primary-subtle)',
                                      color: 'var(--brand-primary-text)',
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {m.user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${m.role?.color || '#EA580C'}15`,
                              color: m.role?.color || 'var(--brand-primary-text)',
                              border: `1px solid ${m.role?.color || '#EA580C'}35`,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {m.role?.name || 'Member'}
                          </span>
                        </td>

                        {/* Team Column */}
                        <td>
                          {m.team ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: 'var(--bg-surface-elevated)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {m.team.name}
                              </span>
                              {m.team.leadUserId === m.user.id && (
                                <span title="Team Lead" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <Crown size={13} color="#F59E0B" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              No Team
                            </span>
                          )}
                        </td>

                        {/* Tasks Column */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenMemberDrawer(m)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.8125rem',
                              color: pendingCount > 0 ? 'var(--brand-primary-text)' : 'var(--text-muted)',
                            }}
                          >
                            <CheckSquare size={14} />
                            <span>
                              {memberTasks.length === 0
                                ? '0 tasks'
                                : `${memberTasks.length - pendingCount}/${memberTasks.length} done`}
                            </span>
                          </button>
                        </td>

                        {/* Status Column */}
                        <td>
                          <span
                            className="status-pill"
                            style={{
                              backgroundColor: m.status === 'Joined' ? 'var(--badge-success-bg)' : 'var(--badge-warning-bg)',
                              color: m.status === 'Joined' ? 'var(--badge-success-text)' : 'var(--badge-warning-text)',
                            }}
                          >
                            <span
                              className="status-dot"
                              style={{
                                backgroundColor: m.status === 'Joined' ? '#10B981' : '#F59E0B',
                              }}
                            />
                            {m.status}
                          </span>
                        </td>

                        {/* Action Column */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenMemberDrawer(m)}
                            className="btn btn-secondary"
                            style={{
                              minHeight: '28px',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.75rem',
                              gap: '0.25rem',
                            }}
                          >
                            <Edit2 size={12} />
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Teams & Squads View */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>Society Teams</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Organise members into functional squads, assign squad leads, and allocate collective tasks.
              </p>
            </div>
            {canEditMembers && (
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(true)}
                className="btn btn-primary"
                style={{ minHeight: '34px', fontSize: '0.8125rem' }}
              >
                <FolderPlus size={14} />
                <span>Create Team</span>
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {teams.length === 0 ? (
              <div
                className="card"
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Layers size={36} color="var(--brand-primary)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  No Teams Created Yet
                </h3>
                <p style={{ fontSize: '0.84375rem', maxWidth: '380px', margin: '0 auto 1rem' }}>
                  Teams allow your society to divide responsibilities like hardware, marketing, finance, and event operations.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(true)}
                  className="btn btn-primary"
                  style={{ minHeight: '36px', fontSize: '0.8125rem' }}
                >
                  Create Your First Team
                </button>
              </div>
            ) : (
              teams.map((t) => {
                const teamMembers = memberRoster.filter((m) => m.team?.id === t.id);
                const leadMember = memberRoster.find((m) => m.user.id === t.leadUserId);

                return (
                  <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                          {t.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {teamMembers.length} active members
                        </div>
                      </div>

                      {canEditMembers && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(t.id, t.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0.25rem',
                          }}
                          title="Delete Team"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Team Lead Indicator */}
                    <div
                      style={{
                        padding: '0.5rem 0.625rem',
                        borderRadius: '0.375rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.78125rem',
                        marginBottom: '0.875rem',
                      }}
                    >
                      <Crown size={14} color="#F59E0B" />
                      <span style={{ color: 'var(--text-muted)' }}>Lead:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {leadMember ? leadMember.user.fullName : 'No Lead Designated'}
                      </span>
                    </div>

                    {/* Team Members List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {teamMembers.slice(0, 5).map((tm) => (
                        <div
                          key={tm.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.78125rem',
                            padding: '0.25rem 0',
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>{tm.user.fullName}</span>
                          <span className="badge" style={{ fontSize: '0.6875rem' }}>
                            {tm.role?.name || 'Member'}
                          </span>
                        </div>
                      ))}

                      {teamMembers.length > 5 && (
                        <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                          +{teamMembers.length - 5} more members
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MANAGE MEMBER DRAWER / MODAL */}
      {selectedMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface)',
              height: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: selectedMember.role?.color || 'var(--brand-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {selectedMember.user.fullName.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>
                    {selectedMember.user.fullName}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedMember.user.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              {/* Section 1: Role & Team Assignment */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Shield size={15} color="var(--brand-primary)" />
                  <span>Assign Role & Team</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem' }}>Role</label>
                    <select
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
                      style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Rank {r.hierarchyRank})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem' }}>Assigned Team</label>
                    <select
                      value={editTeamId}
                      onChange={(e) => setEditTeamId(e.target.value)}
                      style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                    >
                      <option value="none">No Team (General Member)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editTeamId && editTeamId !== 'none' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isTeamLeadCheck}
                        onChange={(e) => setIsTeamLeadCheck(e.target.checked)}
                        style={{ width: '16px', height: '16px', minHeight: 'unset' }}
                      />
                      <span>Appoint as Team Lead for this team</span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveMemberAssignments}
                    className="btn btn-primary"
                    style={{ minHeight: '36px', fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  >
                    Save Role & Team
                  </button>
                </div>
              </div>

              {/* Section 2: Assign Task to Member */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckSquare size={15} color="var(--brand-primary)" />
                  <span>Assign New Task</span>
                </h4>

                <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div>
                    <input
                      type="text"
                      placeholder="Task Title (e.g. Finish sponsorship deck)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      style={{ fontSize: '0.8125rem', minHeight: '36px' }}
                      required
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Description or checklist instructions..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      style={{ fontSize: '0.8125rem', minHeight: '60px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.6875rem' }}>Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        style={{ fontSize: '0.75rem', minHeight: '34px' }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6875rem' }}>Due Date</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        style={{ fontSize: '0.75rem', minHeight: '34px' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAssigningTask}
                    className="btn btn-secondary"
                    style={{ minHeight: '36px', fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  >
                    <Plus size={14} />
                    <span>Assign Task to {selectedMember.user.fullName.split(' ')[0]}</span>
                  </button>
                </form>
              </div>

              {/* Section 3: Member Assigned Tasks */}
              <div>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.625rem', color: 'var(--text-primary)' }}>
                  Assigned Tasks ({tasks.filter((t) => t.assignedToUserId === selectedMember.user.id).length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {tasks.filter((t) => t.assignedToUserId === selectedMember.user.id).length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                      No tasks currently assigned to this member.
                    </div>
                  ) : (
                    tasks
                      .filter((t) => t.assignedToUserId === selectedMember.user.id)
                      .map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.625rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            fontSize: '0.78125rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(t)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: t.status === 'completed' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              {t.status === 'completed' && <Check size={12} />}
                            </button>
                            <span
                              style={{
                                textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                                fontWeight: 500,
                              }}
                            >
                              {t.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '0.2rem',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Danger Zone: Remove Member */}
              {canEditMembers && (
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={handleRemoveMember}
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      minHeight: '34px',
                      fontSize: '0.78125rem',
                      color: 'var(--badge-error-text)',
                      borderColor: 'var(--badge-error-bg)',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove Member from Society</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>Create Society Team</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78125rem' }}>Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous Navigation Squad"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78125rem' }}>Assign Team Lead (Optional)</label>
                <select
                  value={newTeamLeadUserId}
                  onChange={(e) => setNewTeamLeadUserId(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                >
                  <option value="">No Team Lead initially</option>
                  {memberRoster.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.fullName} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>Add / Invite Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: 'var(--badge-error-bg)', color: 'var(--badge-error-text)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78125rem' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78125rem' }}>University Email</label>
                <input
                  type="email"
                  placeholder="e.g. alex.morgan@imperial.ac.uk"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78125rem' }}>Initial Role</label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78125rem' }}>Team Assignment</label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                >
                  <option value="none">No Team initially</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Dispatch Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET IMPORT MODAL */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>Import Spreadsheet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {parseError && (
              <div style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: 'var(--badge-error-bg)', color: 'var(--badge-error-text)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {parseError}
              </div>
            )}

            {!importPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1.5rem 0' }}>
                <UploadCloud size={36} color="var(--brand-primary)" style={{ margin: '0 auto' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Upload your society membership roster
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Supports CSV or Excel (.xlsx). Columns required: Full Name, Email, Role, Team (optional).
                  </div>
                </div>

                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="btn btn-primary"
                  style={{ alignSelf: 'center', minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  {isParsing ? 'Parsing Rows...' : 'Select CSV or Excel File'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Found <strong>{importPreview.members.filter((m) => m.status !== 'error').length}</strong> valid rows ({importPreview.errorCount} with errors).
                </div>

                <div className="enterprise-table-container" style={{ maxHeight: '240px' }}>
                  <table className="enterprise-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.members
                        .filter((m) => m.status !== 'error')
                        .map((r, i) => (
                          <tr key={i}>
                            <td>{r.fullName}</td>
                            <td>{r.email}</td>
                            <td>{r.roleName}</td>
                            <td>{r.teamName || 'None'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="btn btn-secondary"
                    style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={isImporting}
                    className="btn btn-primary"
                    style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                  >
                    {isImporting
                      ? 'Importing...'
                      : `Import ${importPreview.members.filter((m) => m.status !== 'error').length} Members`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
