import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const { id } = await params;

    const period = await prisma.timePeriod.findFirst({
      where: { id, organizationId },
      include: {
        entries: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            project: {
              include: {
                client: { select: { id: true, name: true, currency: true } },
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Compute aggregate stats
    const totalEntries = period.entries.length;
    const totalSeconds = period.entries.reduce(
      (sum, e) => sum + (e.durationSeconds ?? 0),
      0,
    );
    const totalBillableAmount = period.entries.reduce((sum, e) => {
      if (!e.isBillable || !e.durationSeconds || !e.project) return sum;
      const rate = Number(e.project.hourlyRate);
      return sum + (e.durationSeconds / 3600) * rate;
    }, 0);

    // Group entries by project
    const projectMap = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        projectColor: string;
        clientName: string | null;
        clientCurrency: string;
        totalSeconds: number;
        billableSeconds: number;
        billableAmount: number;
        entryCount: number;
      }
    >();

    for (const entry of period.entries) {
      const key = entry.projectId ?? '__no_project__';
      const projectName = entry.project?.name ?? 'No Project';
      const projectColor = entry.project?.color ?? '#6B7280';
      const clientName = entry.project?.client?.name ?? null;
      const clientCurrency = entry.project?.client?.currency ?? 'USD';

      if (!projectMap.has(key)) {
        projectMap.set(key, {
          projectId: key,
          projectName,
          projectColor,
          clientName,
          clientCurrency,
          totalSeconds: 0,
          billableSeconds: 0,
          billableAmount: 0,
          entryCount: 0,
        });
      }

      const group = projectMap.get(key)!;
      const seconds = entry.durationSeconds ?? 0;
      group.totalSeconds += seconds;
      group.entryCount += 1;

      if (entry.isBillable && entry.project) {
        const rate = Number(entry.project.hourlyRate);
        group.billableSeconds += seconds;
        group.billableAmount += (seconds / 3600) * rate;
      }
    }

    const byProject = Array.from(projectMap.values()).map((g) => ({
      ...g,
      billableAmount: Math.round(g.billableAmount * 100) / 100,
    }));

    return NextResponse.json({
      ...period,
      stats: {
        totalEntries,
        totalSeconds,
        totalBillableAmount: Math.round(totalBillableAmount * 100) / 100,
      },
      byProject,
    });
  } catch (err) {
    console.error('[periods/:id GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
