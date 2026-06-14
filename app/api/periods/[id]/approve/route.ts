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

    const role = (session.user as { role: string }).role;
    if (!['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const { id } = await params;

    const period = await prisma.timePeriod.findFirst({ where: { id, organizationId } });
    if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (period.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `Period must be PENDING_APPROVAL to approve (current status: ${period.status})` },
        { status: 400 },
      );
    }

    // Fetch approver's name to store in approvedBy
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const updated = await prisma.timePeriod.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approver?.name ?? session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[periods/approve PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
