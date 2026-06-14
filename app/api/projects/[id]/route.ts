import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  clientId: z.string().nullable().optional(),
  color: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const { id } = await params;

    const project = await prisma.project.findFirst({ where: { id, organizationId } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Validate clientId if provided
    if (parsed.data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, organizationId },
      });
      if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: parsed.data,
      include: {
        client: { select: { id: true, name: true, currency: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[projects PATCH] error:', err);
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

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const { id } = await params;

    const project = await prisma.project.findFirst({ where: { id, organizationId } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Archive instead of hard delete to preserve time entry history
    await prisma.project.update({ where: { id }, data: { isArchived: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[projects DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
