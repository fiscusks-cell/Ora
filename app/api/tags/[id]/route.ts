import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAuth(['OWNER', 'ADMIN']);
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const tag = await prisma.tag.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!tag) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
