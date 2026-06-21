import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = session.user as { id: string; organizationId: string };

    const invoices = await prisma.invoice.findMany({
      where: { organizationId: sessionUser.organizationId },
      include: {
        period: { select: { startDate: true, endDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      amount: inv.amount,
      currency: inv.currency,
      createdAt: inv.createdAt.toISOString(),
      periodStart: inv.period?.startDate?.toISOString() ?? null,
      periodEnd: inv.period?.endDate?.toISOString() ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[invoices GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
