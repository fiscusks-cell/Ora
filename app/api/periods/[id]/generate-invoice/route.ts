import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrency, roundForCurrency, formatCurrency } from '@/lib/currency';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { format, addDays } from 'date-fns';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = session.user as { id: string; organizationId: string };
    const { id } = await params;

    // ── load period with entries ─────────────────────────────────────────────

    const period = await prisma.timePeriod.findFirst({
      where: { id, organizationId: sessionUser.organizationId },
      include: {
        entries: {
          where: { isBillable: true, durationSeconds: { gt: 0 } },
          include: { project: { include: { client: true } } },
        },
        organization: true,
      },
    });

    if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (period.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Period must be APPROVED before generating invoice (current: ${period.status})` },
        { status: 400 },
      );
    }

    // ── generate invoice number ─────────────────────────────────────────────

    const invoiceCount = await prisma.invoice.count({
      where: { organizationId: sessionUser.organizationId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

    // ── group entries by project ─────────────────────────────────────────────

    type LineGroup = {
      projectName: string;
      totalHours: number;
      hourlyRate: number;
      amount: number;
    };

    const byProject = new Map<string, LineGroup>();

    for (const entry of period.entries) {
      const key = entry.projectId ?? '__no_project__';
      const rate = entry.project ? parseFloat(entry.project.hourlyRate.toString()) : 0;
      const hours = (entry.durationSeconds ?? 0) / 3600;

      if (!byProject.has(key)) {
        byProject.set(key, {
          projectName: entry.project?.name ?? 'Time',
          totalHours: 0,
          hourlyRate: rate,
          amount: 0,
        });
      }

      const g = byProject.get(key)!;
      g.totalHours += hours;
      g.amount += hours * rate;
    }

    // ── resolve client and currency ──────────────────────────────────────────

    let billTo = { name: 'Unknown Client', email: '' };
    let currency = 'USD';

    for (const entry of period.entries) {
      if (entry.project?.client) {
        billTo = {
          name: entry.project.client.name,
          email: (entry.project.client as { email?: string }).email ?? '',
        };
        currency = ((entry.project.client as { currency?: string }).currency ?? 'USD').toUpperCase();
        break;
      }
    }

    // ── build line items and totals ──────────────────────────────────────────

    const lineItems = Array.from(byProject.values()).map((g) => ({
      description: g.projectName,
      hours: parseFloat(g.totalHours.toFixed(2)),
      rate: roundForCurrency(g.hourlyRate, currency),
      amount: roundForCurrency(g.amount, currency),
    }));

    const subtotal = roundForCurrency(
      lineItems.reduce((sum, item) => sum + item.amount, 0),
      currency,
    );
    const tax = 0;
    const total = subtotal;

    // ── build InvoiceData ────────────────────────────────────────────────────

    const now = new Date();

    const invoiceData = {
      invoiceNumber,
      date: format(now, 'MMM d, yyyy'),
      dueDate: format(addDays(now, 30), 'MMM d, yyyy'),
      billTo,
      from: { name: period.organization.name },
      lineItems,
      subtotal,
      tax,
      total,
      currency,
    };

    // ── generate PDF ─────────────────────────────────────────────────────────

    const pdfBuffer = await generateInvoicePdf(invoiceData);

    // ── save invoice record ──────────────────────────────────────────────────

    // Resolve clientId from entries
    let clientId = '';
    for (const entry of period.entries) {
      if (entry.project?.client?.id) {
        clientId = entry.project.client.id;
        break;
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'No client found on billable entries' }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: sessionUser.organizationId,
        periodId: id,
        invoiceNumber,
        clientId,
        amount: total,
        currency,
        pdfData: new Uint8Array(pdfBuffer),
      },
    });

    // ── return PDF response ──────────────────────────────────────────────────

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
        'X-Invoice-Id': invoice.id,
        'X-Invoice-Number': invoiceNumber,
      },
    });
  } catch (err) {
    console.error('[periods/generate-invoice POST] error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
