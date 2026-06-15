import { NextRequest, NextResponse } from 'next/server';
import { Invoice, LineItem, Contact, LineAmountTypes, CurrencyCode } from 'xero-node';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidXeroClient } from '@/lib/xero';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = session.user as { id: string; organizationId: string };
    const { id } = await params;

    // ── load period with billable entries ────────────────────────────────────

    const period = await prisma.timePeriod.findFirst({
      where: { id, organizationId: sessionUser.organizationId },
      include: {
        entries: {
          where: { isBillable: true, durationSeconds: { gt: 0 } },
          include: {
            project: { include: { client: true } },
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (period.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Period must be APPROVED before publishing (current: ${period.status})` },
        { status: 400 },
      );
    }

    if (period.xeroInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice already published to Xero', invoiceId: period.xeroInvoiceId },
        { status: 409 },
      );
    }

    // ── demo stub when credentials absent ────────────────────────────────────

    if (!process.env.XERO_CLIENT_ID) {
      const stubId = `XERO-DEMO-${id}`;
      await prisma.timePeriod.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), xeroInvoiceId: stubId },
      });
      return NextResponse.json({
        ok: true,
        invoiceId: stubId,
        message: 'Demo mode — add XERO_CLIENT_ID to enable real Xero publishing.',
      });
    }

    // ── get valid (auto-refreshed) Xero client ───────────────────────────────

    const { xero, tenantId } = await getValidXeroClient(sessionUser.id);

    // ── group billable entries by project ────────────────────────────────────

    type LineGroup = {
      projectName: string;
      clientName: string | null;
      xeroContactId: string | null;
      clientCurrency: string | null;
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
          clientName: entry.project?.client?.name ?? null,
          xeroContactId: entry.project?.client?.xeroContactId ?? null,
          clientCurrency: (entry.project?.client as { currency?: string } | null)?.currency ?? null,
          totalHours: 0,
          hourlyRate: rate,
          amount: 0,
        });
      }

      const g = byProject.get(key)!;
      g.totalHours += hours;
      g.amount += hours * rate;
    }

    // ── detect client currency ────────────────────────────────────────────────

    let clientCurrency = 'USD';
    for (const [, g] of byProject) {
      if (g.clientCurrency) { clientCurrency = g.clientCurrency.toUpperCase(); break; }
    }

    const isJPY = clientCurrency === 'JPY';

    // ── resolve or create Xero Contact ───────────────────────────────────────

    async function ensureContact(clientName: string, existingContactId: string | null): Promise<string> {
      if (existingContactId) return existingContactId;

      const searchRes = await xero.accountingApi.getContacts(tenantId, undefined, `Name="${clientName}"`);
      const found = searchRes.body.contacts?.[0];
      if (found?.contactID) return found.contactID;

      const createRes = await xero.accountingApi.createContacts(tenantId, {
        contacts: [{ name: clientName }],
      });
      const contactId = createRes.body.contacts?.[0]?.contactID;
      if (!contactId) throw new Error(`Failed to create Xero contact for "${clientName}"`);
      return contactId;
    }

    let primaryContactId: string | null = null;
    let primaryClientName: string | null = null;

    for (const [, g] of byProject) {
      if (g.clientName) {
        primaryContactId = await ensureContact(g.clientName, g.xeroContactId);
        primaryClientName = g.clientName;

        if (!g.xeroContactId) {
          await prisma.client.updateMany({
            where: { organizationId: sessionUser.organizationId, name: g.clientName },
            data: { xeroContactId: primaryContactId },
          });
        }
        break;
      }
    }

    if (!primaryContactId) {
      primaryContactId = await ensureContact('Time Tracking Client', null);
    }

    // ── build line items ─────────────────────────────────────────────────────

    const rateDecimals = isJPY ? 0 : 2;
    const lineItems: LineItem[] = Array.from(byProject.values()).map((g) => ({
      description: `${g.projectName} — ${g.totalHours.toFixed(2)} hrs @ ${isJPY ? '¥' : '$'}${g.hourlyRate.toFixed(rateDecimals)}/hr`,
      quantity: parseFloat(g.totalHours.toFixed(4)),
      unitAmount: isJPY ? Math.round(g.hourlyRate) : parseFloat(g.hourlyRate.toFixed(2)),
      accountCode: '200',
      lineAmount: isJPY ? Math.round(g.amount) : parseFloat(g.amount.toFixed(2)),
    }));

    // ── create Xero Invoice ───────────────────────────────────────────────────

    const contact: Contact = { contactID: primaryContactId };
    if (primaryClientName) contact.name = primaryClientName;

    const invoice: Invoice = {
      type: Invoice.TypeEnum.ACCREC,
      contact,
      lineItems,
      lineAmountTypes: LineAmountTypes.Exclusive,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      reference: `ORA-${id.slice(-8).toUpperCase()}`,
      status: Invoice.StatusEnum.AUTHORISED,
      ...(clientCurrency !== 'USD' && { currencyCode: clientCurrency as unknown as CurrencyCode }),
    };

    const invoiceRes = await xero.accountingApi.createInvoices(tenantId, { invoices: [invoice] });
    const created = invoiceRes.body.invoices?.[0];

    if (!created?.invoiceID) {
      const detail = JSON.stringify(invoiceRes.body);
      console.error('[xero publish] invoice create failed:', detail);
      return NextResponse.json({ error: 'Failed to create Xero invoice', detail }, { status: 502 });
    }

    const xeroInvoiceId = created.invoiceID;
    const invoiceNumber = created.invoiceNumber ?? xeroInvoiceId;

    // ── attach PDF report (best-effort) ──────────────────────────────────────

    if (period.reportPdfUrl) {
      try {
        const pdfRes = await fetch(period.reportPdfUrl);
        if (pdfRes.ok) {
          const buffer = Buffer.from(await pdfRes.arrayBuffer());
          await xero.accountingApi.createInvoiceAttachmentByFileName(
            tenantId,
            xeroInvoiceId,
            `ORA-period-${id.slice(-8)}.pdf`,
            buffer,
            true,
          );
        }
      } catch (attachErr) {
        console.warn('[xero publish] PDF attach failed (non-fatal):', attachErr);
      }
    }

    // ── update TimePeriod ─────────────────────────────────────────────────────

    await prisma.timePeriod.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), xeroInvoiceId },
    });

    return NextResponse.json({ ok: true, invoiceId: xeroInvoiceId, invoiceNumber });
  } catch (err) {
    console.error('[periods/publish/xero POST] error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
