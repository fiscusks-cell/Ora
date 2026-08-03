import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await requireAuth(['OWNER', 'ADMIN']);
    if (authz instanceof NextResponse) return authz;
    const { organizationId } = authz;
    const { id } = await params;

    const invite = await prisma.invite.findFirst({ where: { id, organizationId } });
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    await prisma.invite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[team/invite/:id DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
