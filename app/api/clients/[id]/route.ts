import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  currency: z.string().optional(),
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

    const client = await prisma.client.findFirst({ where: { id, organizationId } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.client.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[clients PATCH] error:', err);
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

    const client = await prisma.client.findFirst({ where: { id, organizationId } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Cascade deletes (projects set clientId = null via SetNull) handled by DB schema
    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[clients DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
