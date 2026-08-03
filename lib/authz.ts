import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export type AuthzRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: AuthzRole;
}

/**
 * Validates the session and re-reads role from the DB (not from the JWT, which goes stale).
 * Pass `roles` to require one of those roles; omit to allow any authenticated member.
 * Returns AuthContext on success or a ready-to-return NextResponse on failure.
 */
export async function requireAuth(roles?: AuthzRole[]): Promise<AuthContext | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionUser = session.user as { id: string; organizationId: string };

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = dbUser.role as AuthzRole;

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { userId: sessionUser.id, organizationId: sessionUser.organizationId, role };
}
