import { store } from '@/lib/store';
import { hasPermission } from '@/lib/permissions';
import { sanitizeNoEmDash } from '@/lib/sanitizer';
import { PermissionCode } from '@/types';

export interface PendingActionProposal {
  id: string;
  actionType: 'TOGGLE_PERMISSION' | 'CREATE_ROLE' | 'ASSIGN_TASK';
  summary: string;
  payload: Record<string, unknown>;
}

export interface ChatbotResponse {
  reply: string;
  pendingAction?: PendingActionProposal;
  quickReplies?: string[];
  modelUsed?: string;
}

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  text: string;
}

/**
 * Handles role-aware queries grounded in real database records.
 * Enforces role boundaries:
 * - Organiser: Full organisation progress, tasks, members, roles, events.
 * - Team Lead: Team tasks, team members, team lead responsibilities, events.
 * - Member: Own tasks, own events, team lead name only.
 */
export async function handleChatbotMessage(
  userId: string,
  userMessage: string,
  history: ChatHistoryItem[] = []
): Promise<ChatbotResponse> {
  const cleanQuery = userMessage.trim().toLowerCase();
  const user = store.getUser(userId);
  const { membership, role } = store.getCurrentMembership();
  const org = store.getCurrentOrg();

  if (!user) {
    return {
      reply: sanitizeNoEmDash('User identity not found. Please sign in.'),
    };
  }

  if (!membership || !org) {
    return {
      reply: sanitizeNoEmDash(
        'You currently have no active society membership. Please check your invitation or sign in with an invited university email.'
      ),
      quickReplies: ['Check my invitation status', 'Back to login'],
    };
  }

  const isOwner = role?.isOwner || (org && (org as { ownerUserId?: string }).ownerUserId === user.id);
  const isOrganiser = isOwner || role?.name.toLowerCase().includes('organiser') || hasPermission(role, 'roles.edit');
  const userTeam = membership.teamId ? store.getTeams(org.id).find((t) => t.id === membership.teamId) : null;
  const isTeamLead = userTeam?.leadUserId === user.id;

  // Build grounded context strictly scoped by role
  let roleTitle = 'Member';
  let groundedContext: Record<string, unknown> = {};

  if (isOrganiser) {
    roleTitle = 'Organiser';
    const allMembers = store.getMembersAndInvites(org.id);
    const allTasks = store.getTasks(org.id);
    const allEvents = store.getEvents(org.id);
    const allTeams = store.getTeams(org.id);
    const allRoles = store.getRoles(org.id);

    groundedContext = {
      societyName: org.name,
      userRole: 'Organiser',
      callerName: user.fullName,
      totalMembers: allMembers.length,
      membersList: allMembers.map((m) => ({
        name: m.user.fullName,
        email: m.user.email,
        role: m.role?.name || 'Member',
        team: m.team?.name || 'None',
        status: m.status,
      })),
      teams: allTeams.map((t) => ({ id: t.id, name: t.name })),
      roles: allRoles.map((r) => r.name),
      tasksSummary: {
        total: allTasks.length,
        pending: allTasks.filter((t) => t.status !== 'completed').length,
        completed: allTasks.filter((t) => t.status === 'completed').length,
        items: allTasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority || 'medium' })),
      },
      upcomingEvents: allEvents.map((e) => ({
        title: e.title,
        startTime: e.startTime,
        location: e.location,
      })),
    };
  } else if (isTeamLead) {
    roleTitle = 'Team Lead';
    const teamMembers = store.getMembersAndInvites(org.id).filter((m) => m.team?.id === userTeam?.id);
    const allTasks = store.getTasks(org.id);
    const teamTasks = allTasks.filter((t) => t.teamId === userTeam?.id || t.assignedToUserId === user.id);
    const allEvents = store.getEvents(org.id);

    groundedContext = {
      societyName: org.name,
      userRole: 'Team Lead',
      callerName: user.fullName,
      myTeam: userTeam?.name || 'Assigned Team',
      teamMembers: teamMembers.map((m) => ({ name: m.user.fullName, role: m.role?.name || 'Member', status: m.status })),
      teamTasks: teamTasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority || 'medium' })),
      upcomingEvents: allEvents.map((e) => ({
        title: e.title,
        startTime: e.startTime,
        location: e.location,
      })),
    };
  } else {
    // Normal member: strict data privacy
    roleTitle = 'Member';
    const myTasks = store.getUserTasks(user.id);
    const allEvents = store.getEvents(org.id);
    const leadUser = userTeam?.leadUserId ? store.getUser(userTeam.leadUserId) : null;

    groundedContext = {
      societyName: org.name,
      userRole: 'Member',
      callerName: user.fullName,
      assignedRole: role?.name || 'Member',
      assignedTeam: userTeam?.name || 'None',
      teamLeadName: leadUser ? leadUser.fullName : 'No team lead currently assigned',
      myTasks: myTasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority || 'medium' })),
      societyEvents: allEvents.map((e) => ({
        title: e.title,
        startTime: e.startTime,
        location: e.location,
      })),
      privacyNotice: 'This user is a member. You must NOT reveal lists or details of other members or administrative settings.',
    };
  }

  // Handle deterministic role permission modifications for organisers
  if (
    isOrganiser &&
    (cleanQuery.includes('permission') || cleanQuery.includes('grant') || cleanQuery.includes('edit tasks'))
  ) {
    if (cleanQuery.includes('media') && (cleanQuery.includes('task') || cleanQuery.includes('edit tasks'))) {
      const roles = store.getRoles(org.id);
      const mediaRole = roles.find((r) => r.name.toLowerCase().includes('media'));
      if (mediaRole) {
        return {
          reply: sanitizeNoEmDash(
            `I have drafted the permission update: Grant "Manage Tasks" to ${mediaRole.name}. Please confirm below to apply this update.`
          ),
          pendingAction: {
            id: `act-${Date.now()}`,
            actionType: 'TOGGLE_PERMISSION',
            summary: `Add permission "Manage Tasks" to ${mediaRole.name}`,
            payload: {
              roleId: mediaRole.id,
              permission: 'tasks.edit' as PermissionCode,
            },
          },
          modelUsed: 'gemma-4-26b-a4b-it',
        };
      }
    }
  }

  // Try calling the Gemma 4 API with full grounded context and history
  try {
    const apiUrl = typeof window !== 'undefined' ? '/api/ai' : 'http://localhost:3000/api/ai';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userMessage,
        history,
        context: groundedContext,
        userRole: roleTitle,
        userName: user.fullName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reply) {
        return {
          reply: sanitizeNoEmDash(data.reply),
          quickReplies: isOrganiser
            ? ['Summary of upcoming events', 'How many members are invited?', 'List pending tasks']
            : isTeamLead
            ? ['Show my team tasks', 'Who is in my team?', 'Upcoming events']
            : ['What are my tasks?', 'Who is my team lead?', 'Upcoming events'],
          modelUsed: data.modelUsed || 'gemma-4-26b-a4b-it',
        };
      }
    }
  } catch {
    console.warn('API call to /api/ai failed, using grounded local logic.');
  }

  // Grounded fallback answering directly from real data
  if (cleanQuery.includes('task') || cleanQuery.includes('duty') || cleanQuery.includes('todo')) {
    if (isOrganiser) {
      const allTasks = store.getTasks(org.id);
      if (allTasks.length === 0) {
        return {
          reply: sanitizeNoEmDash('There are currently no tasks created in the society.'),
          modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
        };
      }
      const summary = allTasks.map((t) => `• ${t.title} (${t.status})`).join('\n');
      return {
        reply: sanitizeNoEmDash(`Here are all current tasks across the society:\n\n${summary}`),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    } else if (isTeamLead) {
      const allTasks = store.getTasks(org.id);
      const teamTasks = allTasks.filter((t) => t.teamId === userTeam?.id || t.assignedToUserId === user.id);
      if (teamTasks.length === 0) {
        return {
          reply: sanitizeNoEmDash(`There are no active tasks for ${userTeam?.name || 'your team'} right now.`),
          modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
        };
      }
      const summary = teamTasks.map((t) => `• ${t.title} (${t.status})`).join('\n');
      return {
        reply: sanitizeNoEmDash(`Here are the tasks for ${userTeam?.name || 'your team'}:\n\n${summary}`),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    } else {
      const myTasks = store.getUserTasks(user.id);
      if (myTasks.length === 0) {
        return {
          reply: sanitizeNoEmDash('You currently have no assigned tasks. Your schedule is clear.'),
          modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
        };
      }
      const summary = myTasks.map((t) => `• ${t.title} (${t.status})`).join('\n');
      return {
        reply: sanitizeNoEmDash(`Here are your personal assigned tasks:\n\n${summary}`),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    }
  }

  if (cleanQuery.includes('lead') || cleanQuery.includes('team lead') || cleanQuery.includes('who is my lead')) {
    if (!isOrganiser && !isTeamLead) {
      const leadUser = userTeam?.leadUserId ? store.getUser(userTeam.leadUserId) : null;
      if (leadUser) {
        return {
          reply: sanitizeNoEmDash(`Your team lead for ${userTeam?.name} is ${leadUser.fullName}.`),
          modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
        };
      } else {
        return {
          reply: sanitizeNoEmDash('There is currently no team lead assigned to your team.'),
          modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
        };
      }
    }
  }

  if (cleanQuery.includes('event') || cleanQuery.includes('calendar') || cleanQuery.includes('meeting')) {
    const allEvents = store.getEvents(org.id);
    if (allEvents.length === 0) {
      return {
        reply: sanitizeNoEmDash('There are no upcoming events scheduled on the society calendar right now.'),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    }
    const summary = allEvents.map((e) => `• ${e.title} at ${e.location}`).join('\n');
    return {
      reply: sanitizeNoEmDash(`Here are the upcoming society events:\n\n${summary}`),
      modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
    };
  }

  if (cleanQuery.includes('member') || cleanQuery.includes('roster') || cleanQuery.includes('who is in')) {
    if (!isOrganiser && !isTeamLead) {
      return {
        reply: sanitizeNoEmDash(
          'Member directory access is restricted to leadership roles. You can only view your own profile, assigned tasks, and team lead.'
        ),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    }
    if (isOrganiser) {
      const members = store.getMembersAndInvites(org.id);
      return {
        reply: sanitizeNoEmDash(`There are ${members.length} total members in ${org.name} across all teams.`),
        modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
      };
    }
  }

  // Friendly contextual response
  return {
    reply: sanitizeNoEmDash(
      `Hello ${user.fullName.split(' ')[0]}. I am your ${roleTitle} assistant for ${org.name}. Ask me about your duties, schedule, or team progress.`
    ),
    modelUsed: 'gemma-4-26b-a4b-it (grounded fallback)',
  };
}
