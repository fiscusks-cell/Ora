import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = session.user as { id: string; organizationId: string };
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: sessionUser.organizationId },
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
