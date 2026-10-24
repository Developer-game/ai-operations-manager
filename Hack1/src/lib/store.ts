import {
  User,
  Organisation,
  OrganiserKey,
  Role,
  Team,
  Membership,
  Invitation,
  UserTimetable,
  Event,
  EventMember,
  EventMemberComment,
  Task,
  AvailabilityResponse,
  MediaAsset,
  SocialPost,
  CrossOrgCollaboration,
  AuditLog,
  ThemeName,
  PermissionCode,
} from '@/types';
import { sanitizeNoEmDash } from './sanitizer';

// Single Demo Organiser Key (and 1 unredeemed testing key)
const INITIAL_KEYS: OrganiserKey[] = [
  {
    id: 'key-demo',
    keyDisplay: 'DEMO-KEY-2026',
    keyHash: 'hash-demo-2026',
    isRedeemed: true,
    redeemedByUserId: 'usr-demo-organiser',
    redeemedAt: '2026-10-01T10:00:00Z',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'key-new',
    keyDisplay: 'KEY-NEW-2026',
    keyHash: 'hash-new-2026',
    isRedeemed: false,
    createdAt: '2026-10-01T10:00:00Z',
  },
];

// Exactly 1 Demo Organisation (clearly labeled)
const INITIAL_ORG: Organisation = {
  id: 'org-demo',
  name: 'Demo Robotics Society [Demo Data]',
  slug: 'demo-robotics',
  logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=160&q=80',
  description: 'University society workspace for testing and demonstration [Demo Data].',
  createdAt: '2026-10-01T10:00:00Z',
};

// Exactly 1 Demo Organiser and 1 Demo Member inside it
const INITIAL_USERS: User[] = [
  {
    id: 'usr-demo-organiser',
    email: 'organiser@demo.rally.ac.uk',
    fullName: 'Demo Organiser [Demo Data]',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    phoneNumber: '+447911000001',
    phoneOptIn: true,
    themePreference: 'light',
    isVerified: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'usr-demo-member',
    email: 'member@demo.rally.ac.uk',
    fullName: 'Demo Member [Demo Data]',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    phoneNumber: '+447911000002',
    phoneOptIn: false,
    themePreference: 'light',
    isVerified: true,
    createdAt: '2026-10-01T10:30:00Z',
  },
];

// Roles in Demo Org (Order determines hierarchy: Index 0 is highest)
const INITIAL_ROLES: Role[] = [
  {
    id: 'role-president',
    organisationId: 'org-demo',
    name: 'Society President [Demo]',
    hierarchyRank: 100,
    isOwner: true,
    color: '#4F46E5',
    permissions: [
      'members.view',
      'members.edit',
      'members.comment',
      'roles.edit',
      'tasks.edit',
      'events.create_publish',
      'availability.view',
      'media.upload',
      'social.manage',
      'chat.manage',
      'chat.delete_messages',
      'collaboration.manage',
    ],
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'role-member',
    organisationId: 'org-demo',
    name: 'General Member [Demo]',
    hierarchyRank: 10,
    isOwner: false,
    color: '#10B981',
    permissions: [
      // Normal member does NOT have members.view by default
      'availability.view',
    ],
    createdAt: '2026-10-01T10:00:00Z',
  },
];

const INITIAL_MEMBERSHIPS: Membership[] = [
  {
    id: 'mem-demo-organiser',
    organisationId: 'org-demo',
    userId: 'usr-demo-organiser',
    roleId: 'role-president',
    status: 'active',
    joinedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'mem-demo-member',
    organisationId: 'org-demo',
    userId: 'usr-demo-member',
    roleId: 'role-member',
    status: 'active',
    joinedAt: '2026-10-01T10:30:00Z',
  },
];

// Empty state arrays for all other resources
const INITIAL_TEAMS: Team[] = [];
const INITIAL_INVITATIONS: Invitation[] = [];
const INITIAL_TIMETABLES: UserTimetable[] = [];
const INITIAL_EVENTS: Event[] = [];
const INITIAL_EVENT_MEMBERS: EventMember[] = [];
const INITIAL_EVENT_COMMENTS: EventMemberComment[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_AVAILABILITY: AvailabilityResponse[] = [];
const INITIAL_MEDIA_ASSETS: MediaAsset[] = [];
const INITIAL_SOCIAL_POSTS: SocialPost[] = [];
const INITIAL_COLLABORATIONS: CrossOrgCollaboration[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];

class AppStore {
  private keys: OrganiserKey[] = [...INITIAL_KEYS];
  private organisations: Organisation[] = [INITIAL_ORG];
  private users: User[] = [...INITIAL_USERS];
  private roles: Role[] = [...INITIAL_ROLES];
  private teams: Team[] = [...INITIAL_TEAMS];
  private memberships: Membership[] = [...INITIAL_MEMBERSHIPS];
  private invitations: Invitation[] = [...INITIAL_INVITATIONS];
  private timetables: UserTimetable[] = [...INITIAL_TIMETABLES];
  private events: Event[] = [...INITIAL_EVENTS];
  private eventMembers: EventMember[] = [...INITIAL_EVENT_MEMBERS];
  private eventComments: EventMemberComment[] = [...INITIAL_EVENT_COMMENTS];
  private tasks: Task[] = [...INITIAL_TASKS];
  private availability: AvailabilityResponse[] = [...INITIAL_AVAILABILITY];
  private mediaAssets: MediaAsset[] = [...INITIAL_MEDIA_ASSETS];
  private socialPosts: SocialPost[] = [...INITIAL_SOCIAL_POSTS];
  private collaborations: CrossOrgCollaboration[] = [...INITIAL_COLLABORATIONS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  // Rate limiting for key redemption (timestamps of failed attempts)
  private failedKeyAttempts: number[] = [];

  private currentUserId: string = 'usr-demo-organiser';
  private currentOrgId: string = 'org-demo';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        keys: this.keys,
        organisations: this.organisations,
        users: this.users,
        roles: this.roles,
        teams: this.teams,
        memberships: this.memberships,
        invitations: this.invitations,
        timetables: this.timetables,
        events: this.events,
        eventMembers: this.eventMembers,
        eventComments: this.eventComments,
        tasks: this.tasks,
        availability: this.availability,
        mediaAssets: this.mediaAssets,
        socialPosts: this.socialPosts,
        collaborations: this.collaborations,
        auditLogs: this.auditLogs,
        currentUserId: this.currentUserId,
        currentOrgId: this.currentOrgId,
      };
      localStorage.setItem('rally_clean_v1', JSON.stringify(state));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('rally_clean_v1') || localStorage.getItem('clubops_clean_v3');
      if (!data) return;
      const parsed = JSON.parse(data);
      if (parsed.users) this.users = parsed.users;
      if (parsed.organisations) this.organisations = parsed.organisations;
      if (parsed.keys) this.keys = parsed.keys;
      if (parsed.roles) this.roles = parsed.roles;
      if (parsed.teams) this.teams = parsed.teams;
      if (parsed.memberships) this.memberships = parsed.memberships;
      if (parsed.invitations) this.invitations = parsed.invitations;
      if (parsed.timetables) this.timetables = parsed.timetables;
      if (parsed.events) this.events = parsed.events;
      if (parsed.eventMembers) this.eventMembers = parsed.eventMembers;
      if (parsed.eventComments) this.eventComments = parsed.eventComments;
      if (parsed.tasks) this.tasks = parsed.tasks;
      if (parsed.availability) this.availability = parsed.availability;
      if (parsed.mediaAssets) this.mediaAssets = parsed.mediaAssets;
      if (parsed.socialPosts) this.socialPosts = parsed.socialPosts;
      if (parsed.collaborations) this.collaborations = parsed.collaborations;
      if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
      if (parsed.currentUserId) this.currentUserId = parsed.currentUserId;
      if (parsed.currentOrgId) this.currentOrgId = parsed.currentOrgId;
    } catch {
      // Fallback to initial seeds
    }
  }

  // Session & Current User
  getCurrentUser(): User | undefined {
    return this.users.find((u) => u.id === this.currentUserId);
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    const membership = this.memberships.find((m) => m.userId === userId);
    if (membership) {
      this.currentOrgId = membership.organisationId;
    }
    this.saveToStorage();
  }

  getCurrentOrg(): Organisation | undefined {
    return this.organisations.find((o) => o.id === this.currentOrgId);
  }

  setCurrentOrg(orgId: string) {
    this.currentOrgId = orgId;
    this.saveToStorage();
  }

  logout() {
    this.currentUserId = '';
    this.saveToStorage();
  }

  getMemberships(): Membership[] {
    return this.memberships;
  }

  getOrganizations(): Organisation[] {
    return this.organisations;
  }

  getOrganisations(): Organisation[] {
    return this.organisations;
  }

  getCurrentMembership(): { membership?: Membership; role?: Role; team?: Team } {
    const membership = this.memberships.find(
      (m) => m.userId === this.currentUserId && m.organisationId === this.currentOrgId
    );
    if (!membership) return {};
    const role = this.roles.find((r) => r.id === membership.roleId);
    const team = this.teams.find((t) => t.id === membership.teamId);
    return { membership, role, team };
  }

  // Users
  getUsers(): User[] {
    return this.users;
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  updateUserTheme(userId: string, theme: ThemeName) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.themePreference = theme;
      this.saveToStorage();
    }
  }

  // Organiser Keys & Rate Limiting (Section A.3)
  getKeys(): OrganiserKey[] {
    return this.keys;
  }

  redeemKey(
    keyString: string,
    user: { email: string; fullName: string; societyName: string }
  ): { success: boolean; message: string; orgId?: string } {
    const now = Date.now();
    // Prune attempts older than 60s
    this.failedKeyAttempts = this.failedKeyAttempts.filter((t) => now - t < 60000);

    if (this.failedKeyAttempts.length >= 5) {
      return {
        success: false,
        message: 'Too many failed key attempts. Please wait 60 seconds before trying again.',
      };
    }

    if (!keyString || !keyString.trim()) {
      return { success: false, message: 'Please enter an organiser key.' };
    }

    const cleanKey = keyString.trim().toUpperCase();
    const keyRecord = this.keys.find((k) => k.keyDisplay === cleanKey);

    if (!keyRecord) {
      this.failedKeyAttempts.push(now);
      return {
        success: false,
        message: 'That key is not valid. Please check it and try again.',
      };
    }

    // Reset failed attempts on success
    this.failedKeyAttempts = [];

    // Unlimited use for testing: DO NOT block with 'This key has already been used'
    // Create or find user
    let userRecord = this.users.find(
      (u) =>
        u.email.toLowerCase() === user.email.toLowerCase() ||
        (user.email.toLowerCase().includes('organiser') && u.email.toLowerCase().includes('organiser'))
    );

    // If user already exists and belongs to an organisation, switch right in
    if (userRecord) {
      const existingMembership = this.memberships.find((m) => m.userId === userRecord!.id);
      if (existingMembership) {
        this.currentUserId = userRecord.id;
        this.currentOrgId = existingMembership.organisationId;
        this.saveToStorage();
        return {
          success: true,
          message: 'Welcome back! Signed into your society.',
          orgId: existingMembership.organisationId,
        };
      }
    }

    if (!userRecord) {
      userRecord = {
        id: `usr-${Date.now()}`,
        email: user.email.toLowerCase(),
        fullName: sanitizeNoEmDash(user.fullName),
        phoneOptIn: false,
        themePreference: 'light',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      this.users.push(userRecord);
    }

    // Create organisation
    const slug = user.societyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newOrg: Organisation = {
      id: `org-${Date.now()}`,
      name: sanitizeNoEmDash(user.societyName),
      slug: slug || `org-${Date.now()}`,
      description: `Official society workspace for ${user.societyName}`,
      createdAt: new Date().toISOString(),
    };
    this.organisations.push(newOrg);

    // Create default Owner role
    const ownerRole: Role = {
      id: `role-${Date.now()}`,
      organisationId: newOrg.id,
      name: 'President',
      hierarchyRank: 100,
      isOwner: true,
      color: '#4F46E5',
      permissions: [
        'members.view',
        'members.edit',
        'members.comment',
        'roles.edit',
        'tasks.edit',
        'events.create_publish',
        'availability.view',
        'media.upload',
        'social.manage',
        'chat.manage',
        'chat.delete_messages',
        'collaboration.manage',
      ],
      createdAt: new Date().toISOString(),
    };

    const memberRole: Role = {
      id: `role-mem-${Date.now()}`,
      organisationId: newOrg.id,
      name: 'Member',
      hierarchyRank: 10,
      isOwner: false,
      color: '#10B981',
      permissions: ['availability.view'],
      createdAt: new Date().toISOString(),
    };

    this.roles.push(ownerRole, memberRole);

    // Bind membership
    const membership: Membership = {
      id: `mem-${Date.now()}`,
      organisationId: newOrg.id,
      userId: userRecord.id,
      roleId: ownerRole.id,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    this.memberships.push(membership);

    // Mark key redeemed
    keyRecord.isRedeemed = true;
    keyRecord.redeemedByUserId = userRecord.id;
    keyRecord.redeemedAt = new Date().toISOString();

    this.currentUserId = userRecord.id;
    this.currentOrgId = newOrg.id;

    this.saveToStorage();
    return { success: true, message: 'Society created successfully!', orgId: newOrg.id };
  }

  // Invitations (Section C.1)
  getInvitations(orgId: string): Invitation[] {
    return this.invitations.filter((i) => i.organisationId === orgId);
  }

  getInvitationByToken(token: string): Invitation | undefined {
    return this.invitations.find((i) => i.token.trim().toUpperCase() === token.trim().toUpperCase());
  }

  createInvitation(
    orgId: string,
    email: string,
    roleId: string,
    teamId?: string
  ): { success: boolean; message: string; invitation?: Invitation } {
    const cleanEmail = email.toLowerCase().trim();

    // Prevent duplicate email (active or pending)
    const activeMember = this.memberships.find((m) => {
      if (m.organisationId !== orgId) return false;
      const u = this.users.find((user) => user.id === m.userId);
      return u && u.email.toLowerCase() === cleanEmail;
    });

    if (activeMember) {
      return {
        success: false,
        message: 'A member with this email address already belongs to this society.',
      };
    }

    const pendingInvite = this.invitations.find(
      (i) => i.organisationId === orgId && i.email.toLowerCase() === cleanEmail && i.status === 'pending'
    );

    if (pendingInvite) {
      return {
        success: false,
        message: 'An invitation has already been sent to this email address.',
      };
    }

    const invite: Invitation = {
      id: `inv-${Date.now()}`,
      organisationId: orgId,
      email: cleanEmail,
      roleId,
      teamId,
      token: `INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'pending',
      invitedByUserId: this.currentUserId,
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.invitations.push(invite);
    this.saveToStorage();
    return { success: true, message: `Invitation dispatched to ${cleanEmail}`, invitation: invite };
  }

  acceptInvitation(
    token: string,
    user: { email: string; fullName: string }
  ): { success: boolean; message: string; orgId?: string } {
    const invite = this.getInvitationByToken(token);
    if (!invite) {
      return { success: false, message: 'Invitation link or code is invalid. Please check and try again.' };
    }
    if (invite.status !== 'pending') {
      return { success: false, message: `This invitation has already been ${invite.status}.` };
    }

    let userRecord = this.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase().trim());
    if (!userRecord) {
      userRecord = {
        id: `usr-${Date.now()}`,
        email: user.email.toLowerCase().trim(),
        fullName: sanitizeNoEmDash(user.fullName),
        phoneOptIn: false,
        themePreference: 'light',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      this.users.push(userRecord);
    }

    // Attach membership
    const membership: Membership = {
      id: `mem-${Date.now()}`,
      organisationId: invite.organisationId,
      userId: userRecord.id,
      roleId: invite.roleId,
      teamId: invite.teamId,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    this.memberships.push(membership);

    invite.status = 'accepted';
    this.currentUserId = userRecord.id;
    this.currentOrgId = invite.organisationId;

    this.saveToStorage();
    return { success: true, message: 'Joined society successfully!', orgId: invite.organisationId };
  }

  // Roles & Hierarchy (Section B.3: Ordering determines hierarchy without rank numbers)
  getRoles(orgId: string): Role[] {
    return this.roles.filter((r) => r.organisationId === orgId);
  }

  reorderRoles(orgId: string, orderedRoleIds: string[]): boolean {
    const otherRoles = this.roles.filter((r) => r.organisationId !== orgId);
    const orgRoles = this.roles.filter((r) => r.organisationId === orgId);

    const reordered: Role[] = [];
    orderedRoleIds.forEach((id) => {
      const found = orgRoles.find((r) => r.id === id);
      if (found) reordered.push(found);
    });

    orgRoles.forEach((r) => {
      if (!reordered.some((x) => x.id === r.id)) reordered.push(r);
    });

    this.roles = [...otherRoles, ...reordered];
    this.saveToStorage();
    return true;
  }

  moveRole(orgId: string, roleId: string, direction: 'up' | 'down'): boolean {
    const orgRoles = this.roles.filter((r) => r.organisationId === orgId);
    const idx = orgRoles.findIndex((r) => r.id === roleId);
    if (idx === -1) return false;

    // Never move root owner out of top position
    if (orgRoles[idx].isOwner) return false;

    if (direction === 'up') {
      if (idx <= 1 && orgRoles[0].isOwner) {
        // Can't move above root owner
        return false;
      }
      if (idx > 0) {
        const temp = orgRoles[idx];
        orgRoles[idx] = orgRoles[idx - 1];
        orgRoles[idx - 1] = temp;
      }
    } else if (direction === 'down') {
      if (idx < orgRoles.length - 1) {
        const temp = orgRoles[idx];
        orgRoles[idx] = orgRoles[idx + 1];
        orgRoles[idx + 1] = temp;
      }
    }

    return this.reorderRoles(orgId, orgRoles.map((r) => r.id));
  }

  createRole(
    orgId: string,
    name: string,
    _rankIgnored: number,
    permissions: PermissionCode[],
    color = '#4F46E5'
  ): Role {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      organisationId: orgId,
      name: sanitizeNoEmDash(name),
      hierarchyRank: 10,
      isOwner: false,
      color,
      permissions,
      createdAt: new Date().toISOString(),
    };
    this.roles.push(newRole);
    this.saveToStorage();
    return newRole;
  }

  updateRolePermissions(roleId: string, permissions: PermissionCode[]): boolean {
    const role = this.roles.find((r) => r.id === roleId);
    if (role && !role.isOwner) {
      role.permissions = permissions;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Teams
  getTeams(orgId: string): Team[] {
    return this.teams.filter((t) => t.organisationId === orgId);
  }

  createTeam(orgId: string, name: string, leadUserId?: string): Team {
    const team: Team = {
      id: `team-${Date.now()}`,
      organisationId: orgId,
      name: sanitizeNoEmDash(name),
      leadUserId,
      createdAt: new Date().toISOString(),
    };
    this.teams.push(team);
    this.saveToStorage();
    return team;
  }

  deleteTeam(orgId: string, teamId: string): boolean {
    const index = this.teams.findIndex((t) => t.id === teamId && t.organisationId === orgId);
    if (index !== -1) {
      this.teams.splice(index, 1);
      // Unlink any members from this team
      this.memberships.forEach((m) => {
        if (m.organisationId === orgId && m.teamId === teamId) {
          m.teamId = undefined;
        }
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  updateMemberRole(orgId: string, userId: string, roleId: string): boolean {
    const membership = this.memberships.find(
      (m) => m.organisationId === orgId && m.userId === userId
    );
    if (!membership) return false;
    membership.roleId = roleId;
    this.saveToStorage();
    this.logAction('member.role.update', 'membership', membership.id, { userId, roleId });
    return true;
  }

  updateMemberTeam(orgId: string, userId: string, teamId: string | undefined, isLead?: boolean): boolean {
    const membership = this.memberships.find(
      (m) => m.organisationId === orgId && m.userId === userId
    );
    if (!membership) return false;
    membership.teamId = teamId || undefined;

    if (teamId && isLead !== undefined) {
      const team = this.teams.find((t) => t.id === teamId);
      if (team) {
        if (isLead) {
          team.leadUserId = userId;
        } else if (team.leadUserId === userId) {
          team.leadUserId = undefined;
        }
      }
    }
    this.saveToStorage();
    this.logAction('member.team.update', 'membership', membership.id, { userId, teamId, isLead });
    return true;
  }

  deleteMember(orgId: string, userId: string): boolean {
    const memIndex = this.memberships.findIndex(
      (m) => m.organisationId === orgId && m.userId === userId
    );
    if (memIndex !== -1) {
      this.memberships.splice(memIndex, 1);
      this.teams.forEach((t) => {
        if (t.leadUserId === userId) t.leadUserId = undefined;
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteTask(taskId: string): boolean {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks.splice(taskIndex, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  loginDemoUser(type: 'organiser' | 'member') {
    const targetId = type === 'organiser' ? 'usr-demo-organiser' : 'usr-demo-member';
    let user = this.users.find((u) => u.id === targetId);
    if (!user) {
      user = this.users.find((u) =>
        type === 'organiser'
          ? u.email.includes('organiser')
          : u.email.includes('member')
      );
    }
    if (user) {
      this.currentUserId = user.id;
      const mem = this.memberships.find((m) => m.userId === user.id);
      if (mem) {
        this.currentOrgId = mem.organisationId;
      } else {
        this.currentOrgId = this.organisations[0]?.id || 'org-demo';
      }
      this.saveToStorage();
    }
  }

  // Memberships & Member Privacy (Section C.1 & C.2)
  canUserViewMembers(userId: string, orgId: string): boolean {
    const membership = this.memberships.find((m) => m.userId === userId && m.organisationId === orgId);
    if (!membership) return false;
    const role = this.roles.find((r) => r.id === membership.roleId);
    if (!role) return false;
    if (role.isOwner) return true;
    return role.permissions.includes('members.view');
  }

  getMembersWithDetails(orgId: string) {
    const members = this.memberships.filter((m) => m.organisationId === orgId);
    return members.map((m) => {
      const user = this.users.find((u) => u.id === m.userId);
      const role = this.roles.find((r) => r.id === m.roleId);
      const team = this.teams.find((t) => t.id === m.teamId);
      return {
        membership: m,
        user,
        role,
        team,
      };
    });
  }

  getMembersAndInvites(orgId: string) {
    const members = this.memberships.filter((m) => m.organisationId === orgId);
    const activeMembers = members.map((m) => {
      const user = this.users.find((u) => u.id === m.userId);
      const role = this.roles.find((r) => r.id === m.roleId);
      const team = this.teams.find((t) => t.id === m.teamId);
      return {
        id: m.id,
        user: user || {
          id: m.userId,
          email: 'unknown',
          fullName: 'Member',
          themePreference: 'light' as const,
          phoneOptIn: false,
          isVerified: true,
          createdAt: m.joinedAt,
        },
        role,
        team,
        status: 'Joined' as const,
        joinedAt: m.joinedAt,
      };
    });

    const pendingInvites = this.invitations
      .filter((i) => i.organisationId === orgId && i.status === 'pending')
      .map((i) => {
        const role = this.roles.find((r) => r.id === i.roleId);
        const team = this.teams.find((t) => t.id === i.teamId);
        return {
          id: i.id,
          user: {
            id: `temp-${i.id}`,
            email: i.email,
            fullName: i.email.split('@')[0].replace('.', ' '),
            themePreference: 'light' as const,
            phoneOptIn: false,
            isVerified: false,
            createdAt: i.createdAt,
          },
          role,
          team,
          status: 'Invited' as const,
          joinedAt: undefined,
          token: i.token,
        };
      });

    return [...activeMembers, ...pendingInvites];
  }

  // Timetables & Free/Busy
  getTimetable(userId: string): UserTimetable | undefined {
    return this.timetables.find((t) => t.userId === userId);
  }

  updateTimetable(userId: string, busySlots: { day: number; start: string; end: string }[], consent: boolean) {
    let entry = this.timetables.find((t) => t.userId === userId);
    if (!entry) {
      entry = {
        userId,
        shareFreeBusyConsent: consent,
        busySlots,
        updatedAt: new Date().toISOString(),
      };
      this.timetables.push(entry);
    } else {
      entry.busySlots = busySlots;
      entry.shareFreeBusyConsent = consent;
      entry.updatedAt = new Date().toISOString();
    }
    this.saveToStorage();
  }

  // Events
  getEvents(orgId: string): Event[] {
    return this.events.filter((e) => e.organisationId === orgId);
  }

  getEvent(id: string): Event | undefined {
    return this.events.find((e) => e.id === id);
  }

  createEvent(event: Omit<Event, 'id' | 'createdAt'>): Event {
    const newEvent: Event = {
      ...event,
      id: `evt-${Date.now()}`,
      title: sanitizeNoEmDash(event.title),
      description: sanitizeNoEmDash(event.description),
      location: sanitizeNoEmDash(event.location),
      createdAt: new Date().toISOString(),
    };
    this.events.push(newEvent);
    this.saveToStorage();
    return newEvent;
  }

  publishEvent(eventId: string) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.status = 'published';
      event.publishedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // Event Members & Comments
  getEventMembers(eventId: string) {
    const members = this.eventMembers.filter((em) => em.eventId === eventId);
    return members.map((em) => {
      const user = this.users.find((u) => u.id === em.userId);
      return { ...em, user };
    });
  }

  assignEventMember(eventId: string, userId: string, eventRole: string, taskSummary?: string) {
    const existing = this.eventMembers.find((em) => em.eventId === eventId && em.userId === userId);
    if (existing) {
      existing.eventRole = sanitizeNoEmDash(eventRole);
      existing.taskSummary = sanitizeNoEmDash(taskSummary);
    } else {
      this.eventMembers.push({
        id: `em-${Date.now()}-${userId}`,
        eventId,
        userId,
        eventRole: sanitizeNoEmDash(eventRole),
        taskSummary: sanitizeNoEmDash(taskSummary),
      });
    }
    this.saveToStorage();
  }

  getEventComments(eventId: string, memberUserId: string): EventMemberComment[] {
    return this.eventComments.filter((c) => c.eventId === eventId && c.memberUserId === memberUserId);
  }

  addEventComment(eventId: string, memberUserId: string, comment: string) {
    this.eventComments.push({
      id: `cm-${Date.now()}`,
      eventId,
      memberUserId,
      authorUserId: this.currentUserId,
      comment: sanitizeNoEmDash(comment),
      createdAt: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  // Tasks
  getTasks(orgId: string): Task[] {
    return this.tasks.filter((t) => t.organisationId === orgId);
  }

  getUserTasks(userId: string): Task[] {
    return this.tasks.filter((t) => t.assignedToUserId === userId);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      title: sanitizeNoEmDash(task.title),
      description: sanitizeNoEmDash(task.description),
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.saveToStorage();
    return newTask;
  }

  updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'completed') {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      this.saveToStorage();
    }
  }

  // Availability
  getEventAvailability(eventId: string): AvailabilityResponse[] {
    return this.availability.filter((a) => a.eventId === eventId);
  }

  setMemberAvailability(eventId: string, userId: string, status: AvailabilityResponse['status'], reason = '') {
    let record = this.availability.find((a) => a.eventId === eventId && a.userId === userId);
    if (!record) {
      record = {
        id: `av-${Date.now()}`,
        eventId,
        userId,
        status,
        reason: sanitizeNoEmDash(reason),
        confirmedByMember: true,
        updatedAt: new Date().toISOString(),
      };
      this.availability.push(record);
    } else {
      record.status = status;
      record.reason = sanitizeNoEmDash(reason);
      record.confirmedByMember = true;
      record.updatedAt = new Date().toISOString();
    }
    this.saveToStorage();
  }

  // Media & Social
  getMediaAssets(orgId: string): MediaAsset[] {
    return this.mediaAssets.filter((m) => m.organisationId === orgId);
  }

  addMediaAsset(orgId: string, asset: Omit<MediaAsset, 'id' | 'organisationId' | 'createdAt'>): MediaAsset {
    const newAsset: MediaAsset = {
      ...asset,
      id: `ast-${Date.now()}`,
      organisationId: orgId,
      fileName: sanitizeNoEmDash(asset.fileName),
      createdAt: new Date().toISOString(),
    };
    this.mediaAssets.push(newAsset);
    this.saveToStorage();
    return newAsset;
  }

  getSocialPosts(orgId: string): SocialPost[] {
    return this.socialPosts.filter((p) => p.organisationId === orgId);
  }

  createSocialPost(post: Omit<SocialPost, 'id' | 'createdAt'>): SocialPost {
    const newPost: SocialPost = {
      ...post,
      id: `post-${Date.now()}`,
      caption: sanitizeNoEmDash(post.caption),
      createdAt: new Date().toISOString(),
    };
    this.socialPosts.push(newPost);
    this.saveToStorage();
    return newPost;
  }

  approveSocialPost(postId: string) {
    const post = this.socialPosts.find((p) => p.id === postId);
    if (post) {
      post.status = 'approved';
      post.approvedByUserId = this.currentUserId;
      post.approvedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  scheduleSocialPost(postId: string, scheduledFor: string) {
    const post = this.socialPosts.find((p) => p.id === postId);
    if (post && post.status === 'approved') {
      post.status = 'scheduled';
      post.scheduledFor = scheduledFor;
      this.saveToStorage();
    }
  }

  // Cross-organisation Collaborations
  getCollaborations(orgId: string): CrossOrgCollaboration[] {
    return this.collaborations.filter(
      (c) => c.requesterOrgId === orgId || c.targetOrgId === orgId
    );
  }

  createCollaboration(
    requesterOrgId: string,
    targetOrgSlug: string,
    sharedSpaceName: string
  ): { success: boolean; message: string } {
    const targetOrg = this.organisations.find((o) => o.slug === targetOrgSlug.trim().toLowerCase());
    if (!targetOrg) {
      return { success: false, message: 'Target society with that slug was not found.' };
    }
    if (targetOrg.id === requesterOrgId) {
      return { success: false, message: 'Cannot collaborate with your own society.' };
    }

    this.collaborations.push({
      id: `collab-${Date.now()}`,
      requesterOrgId,
      targetOrgId: targetOrg.id,
      sharedSpaceName: sanitizeNoEmDash(sharedSpaceName),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    this.saveToStorage();
    return { success: true, message: 'Collaboration request sent successfully!' };
  }

  // Audit Logs
  logAction(action: string, resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      organisationId: this.currentOrgId,
      actorType: 'user',
      actorId: this.currentUserId,
      action: sanitizeNoEmDash(action),
      resourceType,
      resourceId,
      metadata,
      createdAt: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  getAuditLogs(orgId: string): AuditLog[] {
    return this.auditLogs.filter((l) => l.organisationId === orgId);
  }

  // Delete Demo Data Utility (Section G)
  deleteDemoData(): void {
    this.organisations = this.organisations.filter((o) => o.id !== 'org-demo');
    this.users = this.users.filter((u) => u.id !== 'usr-demo-organiser' && u.id !== 'usr-demo-member');
    this.roles = this.roles.filter((r) => r.organisationId !== 'org-demo');
    this.memberships = this.memberships.filter((m) => m.organisationId !== 'org-demo');
    this.keys = this.keys.filter((k) => k.id !== 'key-demo');
    if (this.currentOrgId === 'org-demo') {
      const remainingOrg = this.organisations[0];
      this.currentOrgId = remainingOrg ? remainingOrg.id : '';
    }
    this.saveToStorage();
  }
}

export const store = new AppStore();
