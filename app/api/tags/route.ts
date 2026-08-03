import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const tags = await prisma.tag.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(tags);
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    const tag = await prisma.tag.create({
      data: { name: parsed.data.name, organizationId: ctx.organizationId },
      select: { id: true, name: true },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }
    console.error('[tags POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
