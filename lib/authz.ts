import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export type AuthzRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: AuthzRole;
  /**
   * Whether this caller may see monetary amounts and rates.
   *
   * Owners and admins always may. For a member it is the workspace's
   * `showAmountsToMembers` setting, following how Clockify and Toggl treat
   * this: a workspace decides whether to show money, rather than the product
   * hardcoding a rule about roles.
   *
   * This covers amounts and the rates they are computed from. It does not
   * cover `isBillable`, which describes the work rather than what it earns.
   */
  canSeeAmounts: boolean;
}

/**
 * Validates the session and re-reads role from the DB (not from the JWT, which goes stale).
 * Pass `roles` to require one of those roles; omit to allow any authenticated member.
 * Returns AuthContext on success or a ready-to-return NextResponse on failure.
 *
 * `forbiddenMessage` overrides the 403 body for routes whose refusal is shown
 * to the user, where a bare Forbidden would be less useful than naming what
 * is required.
 */
export async function requireAuth(
  roles?: AuthzRole[],
  forbiddenMessage = 'Forbidden',
): Promise<AuthContext | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionUser = session.user as { id: string; organizationId: string };

  // The organization's money setting rides along on the query that already
  // re-reads the role, so deciding visibility costs no extra round trip.
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, organization: { select: { showAmountsToMembers: true } } },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = dbUser.role as AuthzRole;

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return NextResponse.json({ error: forbiddenMessage }, { status: 403 });
  }

  return {
    userId: sessionUser.id,
    organizationId: sessionUser.organizationId,
    role,
    canSeeAmounts: role !== 'MEMBER' || dbUser.organization.showAmountsToMembers,
  };
}
