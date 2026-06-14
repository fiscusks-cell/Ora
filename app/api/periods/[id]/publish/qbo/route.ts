import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    if (period.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Period must be APPROVED before publishing (current status: ${period.status})` },
        { status: 400 },
      );
    }

    if (period.qboInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice already published to QuickBooks', invoiceId: period.qboInvoiceId },
        { status: 409 },
      );
    }

    if (!process.env.INTUIT_CLIENT_ID) {
      // Stub / demo mode: publish with a demo invoice ID so the UI can show the flow
      const stubInvoiceId = `QBO-DEMO-${id}`;

      await prisma.timePeriod.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          qboInvoiceId: stubInvoiceId,
        },
      });

      return NextResponse.json({
        ok: true,
        invoiceId: stubInvoiceId,
        message: 'QuickBooks integration not configured. Add INTUIT_CLIENT_ID to environment variables.',
      });
    }

    // Full QBO OAuth + invoice creation would be implemented here once INTUIT_CLIENT_ID is set.
    // For now, return a ready confirmation so future implementation can plug in.
    return NextResponse.json({
      ok: true,
      message: 'QBO integration ready but not yet implemented',
    });
  } catch (err) {
    console.error('[periods/publish/qbo POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
