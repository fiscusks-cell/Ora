import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Connection state belongs to the people who can act on it; the Integrations
  // tab is hidden from members for the same reason.
  const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
  if (authz instanceof NextResponse) return authz;
  const { userId } = authz;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { connectedQBO: true, qboRealmId: true } });

  return NextResponse.json({ connected: user?.connectedQBO ?? false, realmId: user?.qboRealmId ?? null });
}
