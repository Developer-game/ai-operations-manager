import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || '';
    const orgId = searchParams.get('orgId') || request.headers.get('x-org-id') || '';

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Missing userId or orgId parameter.' },
        { status: 400 }
      );
    }

    // Server-side permission check:
    const canView = store.canUserViewMembers(userId, orgId);

    if (!canView) {
      return NextResponse.json(
        {
          error: 'Access forbidden: You do not have permission to view other members. Members can only view their own profile, tasks, events, and team lead.',
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      );
    }

    // User is authorized: return combined list of joined members and invited members
    const membersAndInvites = store.getMembersAndInvites(orgId);
    return NextResponse.json({
      success: true,
      data: membersAndInvites,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch members.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orgId, email, roleId, teamId } = body;

    if (!userId || !orgId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, orgId, and email are required.' },
        { status: 400 }
      );
    }

    // Check permission to add/invite members
    const membership = store.getMemberships().find(
      (m: any) => m.userId === userId && m.organisationId === orgId && m.status === 'active'
    );

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized: Active membership not found.' },
        { status: 401 }
      );
    }

    const org = store.getOrganisations().find((o: any) => o.id === orgId);
    const role = store.getRoles(orgId).find((r: any) => r.id === membership.roleId);
    const isOrganiser = (org as any)?.ownerUserId === userId || role?.isOwner || role?.name.toLowerCase().includes('organiser');
    const hasAddPermission = isOrganiser || (role?.permissions.includes('members.edit') ?? false);

    if (!hasAddPermission) {
      return NextResponse.json(
        { error: 'Access forbidden: You do not have permission to invite members.' },
        { status: 403 }
      );
    }

    const inviteResult = store.createInvitation(orgId, email, roleId, teamId);
    if (!inviteResult.success) {
      return NextResponse.json(
        { error: inviteResult.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: inviteResult.invitation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create member invitation.' },
      { status: 500 }
    );
  }
}
