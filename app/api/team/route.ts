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

    const members = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        timeEntries: {
          where: {
            startedAt: { gte: startOfMonth },
            stoppedAt: { not: null },
          },
          select: { durationSeconds: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = members.map(({ timeEntries, ...member }) => ({
      ...member,
      hoursThisMonth:
        Math.round(
          (timeEntries.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) / 3600) * 100,
        ) / 100,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[team GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
