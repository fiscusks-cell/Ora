import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  description: z.string().nullable().optional(),
  startedAt: z.string().datetime().optional(),
  stoppedAt: z.string().datetime().nullable().optional(),
  projectId: z.string().nullable().optional(),
  isBillable: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Resolve effective startedAt and stoppedAt for duration calculation
    const effectiveStartedAt = data.startedAt ? new Date(data.startedAt) : entry.startedAt;
    const effectiveStoppedAt =
      data.stoppedAt !== undefined
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
      },
      include: {
        project: { select: { id: true, name: true, color: true, hourlyRate: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
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
