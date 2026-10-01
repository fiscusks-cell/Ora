import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // This was open to any member on the reasoning that a member submits their
    // own work. A period is an org-wide bucket spanning every client and every
    // person, so there is no member-owned period to submit.
    const authz = await requireAuth(['OWNER', 'ADMIN']);
    if (authz instanceof NextResponse) return authz;
    const { organizationId } = authz;
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
