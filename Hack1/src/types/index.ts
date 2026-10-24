/**
 * Complete Data Model Types
 * Supports user-defined roles, Discord-style hierarchy, permissions,
 * multi-theme system, and all AI agent interactions.
 */

export type ThemeName = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phoneOptIn: boolean;
  themePreference: ThemeName;
  isVerified: boolean;
  createdAt: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  logoUrl?: string;
  description?: string;
  createdAt: string;
}

export interface OrganiserKey {
  id: string;
  keyDisplay: string;
  keyHash: string;
  isRedeemed: boolean;
  redeemedByUserId?: string;
  redeemedAt?: string;
  createdAt: string;
}

export type PermissionCode =
  | 'members.view'
  | 'members.edit'
  | 'roles.edit'
  | 'tasks.edit'
  | 'events.create_publish'
  | 'members.comment'
  | 'chat.delete_messages'
  | 'chat.manage'
  | 'media.upload'
  | 'social.manage'
  | 'availability.view'
  | 'collaboration.manage';

export interface PermissionDefinition {
  code: PermissionCode;
  label: string;
  description: string;
  category: 'Members' | 'Events & Tasks' | 'Chat' | 'Media & Social' | 'Organisation';
}

export interface Role {
  id: string;
  organisationId: string;
  name: string;
  hierarchyRank: number; // 100 = Owner, 80 = Exec, 50 = Lead, 10 = Member
  isOwner: boolean;
  color?: string;
  permissions: PermissionCode[];
  createdAt: string;
}

export interface Team {
  id: string;
  organisationId: string;
  name: string;
  leadUserId?: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  organisationId: string;
  userId: string;
  roleId: string;
  teamId?: string;
  status: 'active' | 'suspended';
  joinedAt: string;
}

export interface Invitation {
  id: string;
  organisationId: string;
  email: string;
  roleId: string;
  teamId?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedByUserId: string;
  expiresAt: string;
  createdAt: string;
}

export interface TimetableSlot {
  day: number; // 1 = Monday ... 7 = Sunday
  start: string; // "09:00"
  end: string;   // "11:00"
}

export interface UserTimetable {
  userId: string;
  shareFreeBusyConsent: boolean;
  busySlots: TimetableSlot[];
  updatedAt: string;
}

export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  organisationId: string;
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  deadline?: string; // ISO
  location: string;
  status: EventStatus;
  createdByUserId: string;
  publishedAt?: string;
  createdAt: string;
}

export interface EventMember {
  id: string;
  eventId: string;
  userId: string;
  eventRole: string;
  taskSummary?: string;
}

export interface EventMemberComment {
  id: string;
  eventId: string;
  memberUserId: string;
  authorUserId: string;
  comment: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  organisationId: string;
  eventId?: string;
  teamId?: string;
  assignedToUserId: string;
  title: string;
  description: string;
  dueDate?: string;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  createdByUserId: string;
  createdAt: string;
}

export type AvailabilityStatus = 'free' | 'busy' | 'unavailable' | 'confirmed' | 'tentative';

export interface AvailabilityResponse {
  id: string;
  eventId: string;
  userId: string;
  status: AvailabilityStatus;
  reason?: string;
  confirmedByMember: boolean;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  organisationId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedByUserId: string;
  createdAt: string;
}

export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter';
export type SocialPostStatus = 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed';

export interface SocialPost {
  id: string;
  organisationId: string;
  assetId?: string;
  platform: SocialPlatform;
  caption: string;
  status: SocialPostStatus;
  scheduledFor?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  postedAt?: string;
  errorLog?: string;
  createdAt: string;
}

export interface WhatsAppMessageDraft {
  id: string;
  organisationId: string;
  templateName: string;
  recipientFilter: 'all' | 'event_team' | 'specific_team';
  filterTargetId?: string;
  body: string;
  optedInCount: number;
  status: 'draft' | 'sent';
  sentAt?: string;
  sentByUserId: string;
}

export interface CrossOrgCollaboration {
  id: string;
  requesterOrgId: string;
  targetOrgId: string;
  sharedSpaceName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'terminated';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organisationId: string;
  actorType: 'user' | 'agent';
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StagedExcelMember {
  fullName: string;
  email: string;
  roleName: string;
  teamName?: string;
  hierarchyRank: number;
  validationStatus: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}
