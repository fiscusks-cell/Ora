import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const { id } = await params;

    const period = await prisma.timePeriod.findFirst({ where: { id, organizationId } });
    if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (period.status !== 'OPEN') {
      return NextResponse.json(
        { error: `Period must be OPEN to submit (current status: ${period.status})` },
        { status: 400 },
      );
    }

    const updated = await prisma.timePeriod.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[periods/submit PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
