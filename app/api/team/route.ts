import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role;
    if (!['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [members, invites] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          timeEntries: {
            where: { startedAt: { gte: startOfMonth }, stoppedAt: { not: null } },
            select: { durationSeconds: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.invite.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date();

    const memberRows = members.map(({ timeEntries, ...m }) => ({
      kind: 'member' as const,
      status: 'ACTIVE' as const,
      ...m,
      createdAt: m.createdAt.toISOString(),
      hoursThisMonth:
        Math.round(
          (timeEntries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0) / 3600) * 100,
        ) / 100,
    }));

    const inviteRows = invites.map((i) => ({
      kind: 'invite' as const,
      status: (i.expiresAt > now ? 'PENDING' : 'EXPIRED') as 'PENDING' | 'EXPIRED',
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));

    return NextResponse.json([...memberRows, ...inviteRows]);
  } catch (err) {
    console.error('[team GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
