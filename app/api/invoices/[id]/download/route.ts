import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // The PDF itself holds line items, rates and totals: owner/admin only.
    const authz = await requireAuth(['OWNER', 'ADMIN']);
    if (authz instanceof NextResponse) return authz;
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: authz.organizationId },
    });

    if (!invoice || !invoice.pdfData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return new NextResponse(invoice.pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[invoices/download GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
