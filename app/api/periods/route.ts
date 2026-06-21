import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  periodType: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('MONTHLY'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as { organizationId: string }).organizationId;

    const periods = await prisma.timePeriod.findMany({
      where: { organizationId },
      include: {
        _count: { select: { entries: true } },
        entries: {
          select: {
            durationSeconds: true,
            isBillable: true,
            project: { select: { hourlyRate: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: 100,
    });

    // Compute totals and strip raw entries from the response
    const result = periods.map((period) => {
      const totalDurationSeconds = period.entries.reduce(
        (sum, e) => sum + (e.durationSeconds ?? 0),
        0,
      );
      const totalBillableAmount = period.entries.reduce((sum, e) => {
        if (!e.isBillable || !e.durationSeconds || !e.project) return sum;
        const rate = Number(e.project.hourlyRate);
        return sum + (e.durationSeconds / 3600) * rate;
      }, 0);

      const { entries, ...rest } = period;
      return {
        ...rest,
        totalDurationSeconds,
        totalBillableAmount: Math.round(totalBillableAmount * 100) / 100,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[periods GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as { organizationId: string }).organizationId;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { startDate, endDate, periodType } = parsed.data;

    const period = await prisma.timePeriod.create({
      data: {
        organizationId,
        periodType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    // Assign unbilled, completed entries in this date range to the new period
    await prisma.timeEntry.updateMany({
      where: {
        user: { organizationId },
        timePeriodId: null,
        stoppedAt: { not: null },
        startedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      data: { timePeriodId: period.id },
    });

    return NextResponse.json(period, { status: 201 });
  } catch (err) {
    console.error('[periods POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
