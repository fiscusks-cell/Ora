import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';

export async function GET() {
  try {
    // Every row is an amount billed to a client: owner/admin only.
    const authz = await requireAuth(['OWNER', 'ADMIN']);
    if (authz instanceof NextResponse) return authz;

    const invoices = await prisma.invoice.findMany({
      where: { organizationId: authz.organizationId },
      include: {
        period: { select: { startDate: true, endDate: true } },
        client: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      amount: Number(inv.amount),
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
