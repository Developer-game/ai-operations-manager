import { PermissionCode, PermissionDefinition, Role, Membership } from '@/types';

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    code: 'members.view',
    label: 'View Members',
    description: 'Can view the society member list and profiles',
    category: 'Members',
  },
  {
    code: 'members.edit',
    label: 'Edit Members',
    description: 'Can invite, assign teams, and modify member records',
    category: 'Members',
  },
  {
    code: 'members.comment',
    label: 'Comment on Member Profiles',
    description: 'Can add internal notes and remarks to member event records',
    category: 'Members',
  },
  {
    code: 'roles.edit',
    label: 'Edit Roles & Permissions',
    description: 'Can create roles and toggle permission bits',
    category: 'Organisation',
  },
  {
    code: 'tasks.edit',
    label: 'Manage Tasks',
    description: 'Can create, edit, assign, and reorder society tasks',
    category: 'Events & Tasks',
  },
  {
    code: 'events.create_publish',
    label: 'Create & Publish Events',
    description: 'Can draft, update, and publish society events and broadcast alerts',
    category: 'Events & Tasks',
  },
  {
    code: 'availability.view',
    label: 'View Availability',
    description: 'Can view aggregated free/busy heatmaps and availability summaries',
    category: 'Events & Tasks',
  },
  {
    code: 'media.upload',
    label: 'Upload Media Assets',
    description: 'Can upload images, banners, and documents to the media hub',
    category: 'Media & Social',
  },
  {
    code: 'social.manage',
    label: 'Manage Social Media',
    description: 'Can generate posters, draft captions, and schedule social posts',
    category: 'Media & Social',
  },
  {
    code: 'chat.manage',
    label: 'Manage Chat & AI Queries',
    description: 'Can configure AI prompts and society-level chat settings',
    category: 'Chat',
  },
  {
    code: 'chat.delete_messages',
    label: 'Delete Chat Messages',
    description: 'Can remove messages and moderation entries',
    category: 'Chat',
  },
  {
    code: 'collaboration.manage',
    label: 'Manage Collaborations',
    description: 'Can send and accept joint society collaboration requests',
    category: 'Organisation',
  },
];

/**
 * Checks if a given role possesses a specific permission.
 * Society owners automatically hold all permissions.
 */
export function hasPermission(role: Role | null | undefined, permission: PermissionCode): boolean {
  if (!role) return false;
  if (role.isOwner) return true;
  return role.permissions.includes(permission);
}

/**
 * Enforces role hierarchy:
 * Hierarchy is determined by the descending order of roles in the list (index 0 is highest).
 * An actor can only edit, assign, or delete roles that are strictly lower in the hierarchy.
 * Owners can modify all non-owner roles.
 */
export function canManageRole(
  actorRole: Role | null | undefined,
  targetRole: Role | null | undefined,
  rolesList?: Role[]
): boolean {
  if (!actorRole) return false;
  if (actorRole.isOwner) return true;
  if (!targetRole) return true;
  if (targetRole.isOwner) return false;

  if (rolesList && rolesList.length > 0) {
    const actorIdx = rolesList.findIndex((r) => r.id === actorRole.id);
    const targetIdx = rolesList.findIndex((r) => r.id === targetRole.id);
    if (actorIdx !== -1 && targetIdx !== -1) {
      // Top of list (lower index) represents higher hierarchy rank
      return actorIdx < targetIdx;
    }
  }

  return actorRole.hierarchyRank > targetRole.hierarchyRank;
}

/**
 * Validates permission with error message generation.
 */
export function assertPermission(role: Role | null | undefined, permission: PermissionCode): { allowed: boolean; reason?: string } {
  if (!role) {
    return { allowed: false, reason: "No role assigned." };
  }
  if (hasPermission(role, permission)) {
    return { allowed: true };
  }
  const definition = PERMISSION_DEFINITIONS.find((p) => p.code === permission);
  const permName = definition ? definition.label : permission;
  return {
    allowed: false,
    reason: `Missing permission: "${permName}". Contact your society organiser for access.`,
  };
}
