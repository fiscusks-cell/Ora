import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeTimeEntry, timeEntryInclude } from '@/lib/time-entry-include';
import { z } from 'zod';

const updateSchema = z
  .object({
    description: z.string().nullable().optional(),
    startedAt: z.string().datetime().optional(),
    // An explicit end time, for editing an entry that has already been recorded.
    stoppedAt: z.string().datetime().nullable().optional(),
    // Stop a running timer on the server clock. A live stop never trusts the
    // browser: the start is already taken on the server, so a client stop time
    // would shift every duration by that browser's clock skew.
    stop: z.literal('now').optional(),
    projectId: z.string().nullable().optional(),
    isBillable: z.boolean().optional(),
    tagIds: z.string().array().optional(),
  })
  .refine((d) => !(d.stop !== undefined && d.stoppedAt !== undefined), {
    message: 'Send either stop or stoppedAt, not both',
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Read before anything else, so a stop records when the request arrived — not
  // when authentication or a waking database finished.
  const serverNow = new Date();

  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const { id } = await params;

    const entry = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Already stopped — by another tab, or by an earlier attempt whose response
    // was lost. Keep the stop that was recorded first rather than moving it later.
    if (data.stop === 'now' && entry.stoppedAt) {
      const current = await prisma.timeEntry.findUniqueOrThrow({
        where: { id },
        include: timeEntryInclude,
      });
      return NextResponse.json(serializeTimeEntry(current));
    }

    // Resolve effective startedAt and stoppedAt for duration calculation
    const effectiveStartedAt = data.startedAt ? new Date(data.startedAt) : entry.startedAt;
    const effectiveStoppedAt =
      data.stop === 'now'
        ? serverNow
        : data.stoppedAt !== undefined
          ? data.stoppedAt
            ? new Date(data.stoppedAt)
            : null
          : entry.stoppedAt;

    let durationSeconds = entry.durationSeconds;
    if (effectiveStoppedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((effectiveStoppedAt.getTime() - effectiveStartedAt.getTime()) / 1000),
      );
    } else {
      // Timer is running — clear duration
      durationSeconds = null;
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.startedAt ? { startedAt: effectiveStartedAt } : {}),
        stoppedAt: effectiveStoppedAt,
        durationSeconds,
        ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
        ...(data.isBillable !== undefined ? { isBillable: data.isBillable } : {}),
        ...(data.tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                createMany: { data: data.tagIds.map((tagId) => ({ tagId })), skipDuplicates: true },
              },
            }
          : {}),
      },
      include: timeEntryInclude,
    });

    return NextResponse.json(serializeTimeEntry(updated));
  } catch (err) {
    console.error('[time-entries PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const { id } = await params;

    const entry = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[time-entries DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
