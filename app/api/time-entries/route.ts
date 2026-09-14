import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTimeEntry, timeEntryInclude } from '@/lib/time-entry-include';
import { z } from 'zod';

const createSchema = z
  .object({
    projectId: z.string().optional(),
    description: z.string().optional(),
    // Honoured only for a completed entry (a duplicate or a manual entry), where
    // the times are the data being recorded. A running timer always starts on the
    // server clock: a browser with a skewed clock must not shift billable time.
    startedAt: z.string().datetime().optional(),
    stoppedAt: z.string().datetime().optional(),
    isBillable: z.boolean().default(true),
    tagIds: z.string().array().optional(),
  })
  .refine((d) => !d.stoppedAt || d.startedAt !== undefined, {
    message: 'startedAt is required when stoppedAt is given',
    path: ['startedAt'],
  });

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;
    const { userId, organizationId, role } = ctx;

    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active') === 'true';
    const filterUserId = searchParams.get('userId');
    const filterProjectId = searchParams.get('projectId');
    const filterClientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // active=true is always self-scoped to the session user — never trust a
    // client-supplied userId here, and always filter to stoppedAt: null.
    if (active) {
      const entries = await prisma.timeEntry.findMany({
        where: { userId, stoppedAt: null },
        include: timeEntryInclude,
        orderBy: { startedAt: 'desc' },
        take: 1,
      });
      return NextResponse.json(entries.map((e) => serializeTimeEntry(e)));
    }

    if (filterUserId && filterUserId !== userId && role === 'MEMBER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        // Default to the session user when no explicit userId is requested.
        // Org-wide queries belong in /api/reports (role-gated), not here.
        userId: filterUserId ?? userId,
        user: { organizationId },
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
        ...(filterClientId ? { project: { clientId: filterClientId } } : {}),
        ...(startDate || endDate
          ? {
              startedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: timeEntryInclude,
      orderBy: { startedAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(entries.map((e) => serializeTimeEntry(e)));
  } catch (err) {
    console.error('[time-entries GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Read before anything else, so a timer's recorded start is when the request
  // arrived — not when authentication or a waking database finished.
  const serverNow = new Date();

  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const organizationId = (session.user as { organizationId: string }).organizationId;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { projectId, description, startedAt, stoppedAt, isBillable, tagIds } = parsed.data;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // A running timer starts on the server clock, and any client startedAt is
    // ignored. A completed entry keeps the times it was given.
    const start = stoppedAt ? new Date(startedAt as string) : serverNow;
    const stop = stoppedAt ? new Date(stoppedAt) : null;
    const durationSeconds = stop
      ? Math.max(0, Math.round((stop.getTime() - start.getTime()) / 1000))
      : null;

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId: projectId ?? null,
        description: description ?? null,
        startedAt: start,
        stoppedAt: stop,
        durationSeconds,
        isBillable,
        ...(tagIds?.length
          ? { tags: { createMany: { data: tagIds.map((tagId) => ({ tagId })), skipDuplicates: true } } }
          : {}),
      },
      include: timeEntryInclude,
    });

    return NextResponse.json(serializeTimeEntry(entry), { status: 201 });
  } catch (err) {
    console.error('[time-entries POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
