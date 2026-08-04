import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { weekStartDay: true },
  });
  return NextResponse.json({ weekStartDay: user?.weekStartDay ?? 1 });
}

const patchSchema = z.object({
  weekStartDay: z.number().int().min(0).max(6),
});

export async function PATCH(req: NextRequest) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { weekStartDay: parsed.data.weekStartDay },
  });
  return NextResponse.json({ weekStartDay: parsed.data.weekStartDay });
}
