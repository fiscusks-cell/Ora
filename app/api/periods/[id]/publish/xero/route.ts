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

    if (period.xeroInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice already published to Xero', invoiceId: period.xeroInvoiceId },
        { status: 409 },
      );
    }

    if (!process.env.XERO_CLIENT_ID) {
      // Stub / demo mode: publish with a demo invoice ID so the UI can show the flow
      const stubInvoiceId = `XERO-DEMO-${id}`;

      await prisma.timePeriod.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          xeroInvoiceId: stubInvoiceId,
        },
      });

      return NextResponse.json({
        ok: true,
        invoiceId: stubInvoiceId,
        message: 'Xero integration not configured. Add XERO_CLIENT_ID to environment variables.',
      });
    }

    // Full Xero OAuth + invoice creation would be implemented here once XERO_CLIENT_ID is set.
    return NextResponse.json({
      ok: true,
      message: 'Xero integration ready but not yet implemented',
    });
  } catch (err) {
    console.error('[periods/publish/xero POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
