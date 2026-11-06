import { Coins, Download, FileText, Lock, Receipt, Users } from 'lucide-react';

/**
 * A dark band where the report is the content: it runs 64% of the viewport
 * and bleeds off the right edge, with the six true claims beside it.
 */

const ITEMS = [
  { icon: Receipt, title: 'One invoice per client, per period', body: 'Enforced in the database, so a retried publish can never double-bill.' },
  { icon: FileText, title: 'The time report rides with the invoice', body: 'A PDF of the hours is attached to every invoice that goes out.' },
  { icon: Coins, title: 'Per-client currency, to the cent', body: 'Money is kept in whole minor units and rounded once per entry — reports, PDFs and invoices agree.' },
  { icon: Users, title: 'Roles that match a firm', body: 'Members track. Owners and admins approve, publish, and choose whether members see rates.' },
  { icon: Lock, title: 'Server-side, not hidden', body: 'What a member may see is decided by the API, never by what the page chooses to draw.' },
  { icon: Download, title: 'Exports for everything else', body: 'CSV and PDF of any report range, with the same numbers as the screen.' },
];

const ROWS = [
  ['Month-end close', 'Harbor & Vale', '62.0', '58.5', '$4,650.00', '#5683da'],
  ['VAT & compliance', 'Nightjar Studio', '41.5', '41.5', '$3,735.00', '#ff8964'],
  ['Bookkeeping', 'Atlas Freight', '45.0', '40.0', '$4,095.00', '#95979e'],
  ['Payroll', 'Harbor & Vale', '14.7', '8.5', '$0.00', '#5683da'],
];

function ReportSurface() {
  return (
    <div className="overflow-hidden rounded-l-[10px] bg-charcoal-card text-snow ring-1 ring-slate-edge/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-edge/60 px-6 py-4">
        <div>
          <p className="text-body-lg font-medium text-snow">Reports · Summary</p>
          <p className="text-caption text-smoke">1 – 31 Oct 2026 · all members</p>
        </div>
        <div className="flex items-center gap-2">
          {['Summary', 'Detailed', 'Workload', 'Profitability'].map((t) => (
            <span key={t} className={`rounded-buttons px-3 py-1.5 text-caption ${t === 'Summary' ? 'bg-electric-iris text-snow' : 'text-smoke'}`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 border-b border-slate-edge/60 px-6 py-5">
        {[['Total hours', '163.2'], ['Billable hours', '148.5'], ['Total amount', '$12,480.00'], ['Active days', '21']].map(([k, v]) => (
          <div key={k}>
            <p className="text-caption text-smoke">{k}</p>
            <p className="mt-1 text-heading-sm font-medium tabular-nums text-snow">{v}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-body">
        <thead>
          <tr className="text-caption text-smoke">
            <th className="px-6 py-3 text-left font-normal">Project</th>
            <th className="px-4 py-3 text-left font-normal">Client</th>
            <th className="px-4 py-3 text-right font-normal">Hours</th>
            <th className="px-4 py-3 text-right font-normal">Billable</th>
            <th className="px-6 py-3 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-edge/40 text-snow">
          {ROWS.map(([p, c, h, b, a, color]) => (
            <tr key={p}>
              <td className="px-6 py-3"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{p}</span></td>
              <td className="px-4 py-3 text-smoke">{c}</td>
              <td className="px-4 py-3 text-right tabular-nums">{h}</td>
              <td className="px-4 py-3 text-right tabular-nums">{b}</td>
              <td className="px-6 py-3 text-right tabular-nums">{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Capabilities() {
  return (
    <section className="relative overflow-hidden bg-obsidian-canvas text-snow">
      <div className="mx-auto grid max-w-[1216px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-center lg:gap-12 lg:py-32">
        <div>
          <h2 className="font-display text-[clamp(2.25rem,4.6vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.025em] text-snow [text-wrap:balance]">
            Built for billing, not just timing.
          </h2>
          <ul className="mt-10 space-y-6">
            {ITEMS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-electric-iris" aria-hidden="true" />
                <div>
                  <p className="text-body-lg font-medium text-snow">{title}</p>
                  <p className="mt-1 max-w-[46ch] text-body text-ash">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* the report: wider than its column, running off the right edge */}
        <div className="relative lg:justify-self-start">
          <div className="w-full lg:w-[min(64vw,1100px)]">
            <ReportSurface />
          </div>
        </div>
      </div>
    </section>
  );
}
