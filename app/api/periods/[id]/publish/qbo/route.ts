import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidClient, qboApiBase } from '@/lib/qbo';
import { getCurrency, roundForCurrency } from '@/lib/currency';

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

    if (period.qboInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice already published to QuickBooks', invoiceId: period.qboInvoiceId },
        { status: 409 },
      );
    }

    // ── demo stub when credentials absent ────────────────────────────────────

    if (!process.env.INTUIT_CLIENT_ID) {
      const stubId = `QBO-DEMO-${id}`;
      await prisma.timePeriod.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), qboInvoiceId: stubId },
      });
      return NextResponse.json({
        ok: true,
        invoiceId: stubId,
        message: 'Demo mode — add INTUIT_CLIENT_ID to enable real QuickBooks publishing.',
      });
    }

    // ── get valid (auto-refreshed) OAuth client ──────────────────────────────

    const { client, realmId } = await getValidClient(sessionUser.id);
    const base = qboApiBase(realmId);
    const token = client.getToken().access_token;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // ── group billable entries by project ────────────────────────────────────

    type LineGroup = {
      projectName: string;
      clientName: string | null;
      qboCustomerId: string | null;
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
          qboCustomerId: entry.project?.client?.qboCustomerId ?? null,
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

    // ── resolve or create QBO Customer for each unique client ────────────────

    async function ensureCustomer(clientName: string, existingQboId: string | null): Promise<string> {
      if (existingQboId) return existingQboId;

      // search first
      const searchRes = await fetch(
        `${base}/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${clientName.replace(/'/g, "\\'")}'`)}&minorversion=65`,
        { headers },
      );
      const searchData = (await searchRes.json()) as { QueryResponse: { Customer?: { Id: string }[] } };
      const existing = searchData.QueryResponse.Customer?.[0];
      if (existing) return existing.Id;

      // create
      const createRes = await fetch(`${base}/customer?minorversion=65`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ DisplayName: clientName }),
      });
      const createData = (await createRes.json()) as { Customer: { Id: string } };
      return createData.Customer.Id;
    }

    // ── detect client currency ────────────────────────────────────────────────

    let clientCurrency: string | null = null;
    for (const [, g] of byProject) {
      if (g.clientCurrency) { clientCurrency = g.clientCurrency.toUpperCase(); break; }
    }

    // ── build Invoice Line items ─────────────────────────────────────────────

    // Pick the primary customer (first group that has one, or "Time Tracking")
    let primaryCustomerId: string | null = null;

    for (const [, g] of byProject) {
      if (g.clientName) {
        primaryCustomerId = await ensureCustomer(g.clientName, g.qboCustomerId);

        // persist QBO customer ID back to Client record if we resolved it
        if (!g.qboCustomerId && g.clientName) {
          await prisma.client.updateMany({
            where: { organizationId: sessionUser.organizationId, name: g.clientName },
            data: { qboCustomerId: primaryCustomerId },
          });
        }
        break;
      }
    }

    if (!primaryCustomerId) {
      // fallback: use a catch-all customer
      primaryCustomerId = await ensureCustomer('Time Tracking Client', null);
    }

    const currencyMeta = getCurrency(clientCurrency ?? 'USD');
    const decimals = clientCurrency === 'JPY' ? 0 : 2;

    const lines = Array.from(byProject.values()).map((g, i) => {
      const unitPrice = roundForCurrency(g.hourlyRate, clientCurrency ?? 'USD');
      const lineAmount = roundForCurrency(g.amount, clientCurrency ?? 'USD');
      return {
        Id: String(i + 1),
        LineNum: i + 1,
        Description: `${g.projectName} — ${g.totalHours.toFixed(2)} hrs @ ${currencyMeta.symbol} ${g.hourlyRate.toFixed(decimals)}/hr`,
        Amount: lineAmount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          Qty: parseFloat(g.totalHours.toFixed(4)),
          UnitPrice: unitPrice,
          ItemRef: { value: '1', name: 'Services' },
        },
      };
    });

    // ── resolve next DocNumber ────────────────────────────────────────────────

    async function getNextDocNumber(): Promise<number> {
      try {
        const qRes = await fetch(
          `${base}/query?query=${encodeURIComponent('SELECT * FROM Invoice ORDERBY DocNumber DESC MAXRESULTS 1')}&minorversion=65`,
          { headers },
        );
        if (!qRes.ok) return 1001;
        const qData = (await qRes.json()) as { QueryResponse: { Invoice?: { DocNumber: string }[] } };
        const invoices = qData.QueryResponse.Invoice ?? [];
        if (invoices.length === 0) return 1001;

        // Find highest purely-numeric DocNumber
        let highest = 0;
        for (const inv of invoices) {
          const n = parseInt(inv.DocNumber, 10);
          if (!isNaN(n) && n > highest) highest = n;
        }

        // If the latest DocNumber wasn't numeric, query for the highest numeric one
        if (highest === 0) {
          const q2Res = await fetch(
            `${base}/query?query=${encodeURIComponent('SELECT * FROM Invoice MAXRESULTS 100')}&minorversion=65`,
            { headers },
          );
          if (q2Res.ok) {
            const q2Data = (await q2Res.json()) as { QueryResponse: { Invoice?: { DocNumber: string }[] } };
            for (const inv of q2Data.QueryResponse.Invoice ?? []) {
              const n = parseInt(inv.DocNumber, 10);
              if (!isNaN(n) && n > highest) highest = n;
            }
          }
        }

        return highest > 0 ? highest + 1 : 1001;
      } catch {
        return 1001;
      }
    }

    const nextDocNumber = await getNextDocNumber();

    // ── create QBO Invoice (with one DocNumber-collision retry) ──────────────

    const periodNote = `Billing period ${period.startDate.toISOString().slice(0, 10)} – ${period.endDate.toISOString().slice(0, 10)}`;

    async function attemptCreate(docNumber: number): Promise<Response> {
      const invoicePayload: Record<string, unknown> = {
        DocNumber: String(docNumber),
        Line: lines,
        CustomerRef: { value: primaryCustomerId },
        TxnDate: new Date().toISOString().slice(0, 10),
        PrivateNote: periodNote,
      };

      if (clientCurrency && clientCurrency !== 'USD') {
        invoicePayload.CurrencyRef = { value: clientCurrency };
      }

      return fetch(`${base}/invoice?minorversion=65`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invoicePayload),
      });
    }

    let invoiceRes: Response;
    try {
      invoiceRes = await attemptCreate(nextDocNumber);

      // Retry once on DocNumber collision (race condition)
      if (!invoiceRes.ok) {
        const peek = await invoiceRes.text();
        if (peek.toLowerCase().includes('docnumber') && peek.toLowerCase().includes('exist')) {
          console.warn('[qbo publish] DocNumber collision, retrying with', nextDocNumber + 1);
          invoiceRes = await attemptCreate(nextDocNumber + 1);
          // Re-wrap the already-consumed body so the error path below can read it
          if (!invoiceRes.ok) {
            const errBody2 = await invoiceRes.text();
            invoiceRes = new Response(errBody2, { status: invoiceRes.status, headers: invoiceRes.headers });
          }
        } else {
          // Re-wrap the already-consumed body for the error handler below
          invoiceRes = new Response(peek, { status: invoiceRes.status, headers: invoiceRes.headers });
        }
      }
    } catch (fetchErr) {
      console.error('[qbo publish] invoice fetch error:', fetchErr);
      return NextResponse.json({ error: 'Network error contacting QuickBooks' }, { status: 502 });
    }

    if (!invoiceRes.ok) {
      const errBody = await invoiceRes.text();
      console.error('[qbo publish] invoice create failed:', errBody);

      const lower = errBody.toLowerCase();
      const isCurrencyError =
        lower.includes('multicurrency') ||
        lower.includes('currency') ||
        /"errorcode"\s*:\s*"?(2500|6000)"?/i.test(errBody);

      if (isCurrencyError) {
        const currencyLabel = clientCurrency ?? 'a non-USD currency';
        return NextResponse.json(
          {
            error: `This client is billed in ${currencyLabel} but your QuickBooks company does not have multicurrency enabled. Please enable it in QBO under Settings → Advanced → Currency, then try again.`,
          },
          { status: 422 },
        );
      }

      return NextResponse.json({ error: 'Failed to create QBO invoice', detail: errBody }, { status: 502 });
    }

    const invoiceData = (await invoiceRes.json()) as { Invoice: { Id: string; DocNumber: string } };
    const qboInvoiceId = invoiceData.Invoice.Id;
    const docNumber = invoiceData.Invoice.DocNumber;

    // ── attach PDF report (best-effort) ──────────────────────────────────────

    // QBO supports attachments via /attachable. We attach if reportPdfUrl is a data URL
    // or a publicly accessible URL. If absent, skip silently.
    if (period.reportPdfUrl) {
      try {
        const attachPayload = {
          AttachableRef: [{ EntityRef: { type: 'Invoice', value: qboInvoiceId } }],
          FileName: `ORA-period-${id.slice(-8)}.pdf`,
          ContentType: 'application/pdf',
          FileAccessUri: period.reportPdfUrl,
        };
        await fetch(`${base}/attachable?minorversion=65`, {
          method: 'POST',
          headers,
          body: JSON.stringify(attachPayload),
        });
      } catch (attachErr) {
        console.warn('[qbo publish] PDF attach failed (non-fatal):', attachErr);
      }
    }

    // ── update TimePeriod ─────────────────────────────────────────────────────

    await prisma.timePeriod.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        qboInvoiceId,
      },
    });

    return NextResponse.json({ ok: true, invoiceId: qboInvoiceId, docNumber });
  } catch (err) {
    console.error('[periods/publish/qbo POST] error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
