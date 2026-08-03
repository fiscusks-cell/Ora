import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  projectId: z.string().optional(),
  description: z.string().optional(),
  startedAt: z.string().datetime(),
  stoppedAt: z.string().datetime().optional(),
  isBillable: z.boolean().default(true),
  tagIds: z.string().array().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const organizationId = (session.user as { organizationId: string }).organizationId;

    const { searchParams } = new URL(req.url);
    const filterUserId = searchParams.get('userId');
    const filterProjectId = searchParams.get('projectId');
    const filterClientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const entries = await prisma.timeEntry.findMany({
      where: {
        user: { organizationId },
        ...(filterUserId ? { userId: filterUserId } : {}),
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
      include: {
        project: { select: { id: true, name: true, color: true, hourlyRate: true, isBillable: true, client: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { startedAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(
      entries.map((e) => ({ ...e, tags: e.tags.map((t) => t.tag) })),
    );
  } catch (err) {
    console.error('[time-entries GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    let durationSeconds: number | undefined;
    if (stoppedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000),
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId: projectId ?? null,
        description: description ?? null,
        startedAt: new Date(startedAt),
        stoppedAt: stoppedAt ? new Date(stoppedAt) : null,
        durationSeconds: durationSeconds ?? null,
        isBillable,
        ...(tagIds?.length
          ? { tags: { createMany: { data: tagIds.map((tagId) => ({ tagId })), skipDuplicates: true } } }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, color: true, hourlyRate: true, isBillable: true } },
        user: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ ...entry, tags: entry.tags.map((t) => t.tag) }, { status: 201 });
  } catch (err) {
    console.error('[time-entries POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
