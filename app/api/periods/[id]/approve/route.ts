import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Approval is the gate in front of invoicing, so the role has to come from
    // the database. A JWT still reads ADMIN until it refreshes, which would let
    // a demoted admin approve a period and move client money forward.
    const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
    if (authz instanceof NextResponse) return authz;
    const { userId, organizationId } = authz;
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
      where: { id: userId },
      select: { name: true },
    });

    const updated = await prisma.timePeriod.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approver?.name ?? userId,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[periods/approve PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
