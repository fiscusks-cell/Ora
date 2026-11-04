import { Coins, Download, FileText, Lock, Receipt, Users } from 'lucide-react';

/**
 * A dark band: the report the owner actually reads, beside the six things the
 * product does that a plain timer does not. Every line is true of the code.
 */

const ITEMS = [
  { icon: Receipt, title: 'One invoice per client, per period', body: 'Enforced in the database, so a retried publish can never double-bill.' },
  { icon: FileText, title: 'The time report rides with the invoice', body: 'A PDF of the hours is attached to every invoice that goes out.' },
  { icon: Coins, title: 'Per-client currency, to the cent', body: 'Money is kept in whole minor units and rounded once per entry — reports, PDFs and invoices agree.' },
  { icon: Users, title: 'Roles that match a firm', body: 'Members track. Owners and admins approve, publish, and choose whether members see rates.' },
  { icon: Lock, title: 'Server-side, not hidden', body: 'What a member may see is decided by the API, never by what the page chooses to draw.' },
  { icon: Download, title: 'Exports for everything else', body: 'CSV and PDF of any report range, with the same numbers as the screen.' },
];

export function Capabilities() {
  return (
    <section className="bg-obsidian-canvas text-snow">
      <div className="mx-auto grid max-w-[var(--page-max-width)] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16 lg:py-24">
        {/* reports mockup */}
        <figure className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-cards border border-slate-edge/80 bg-charcoal-card shadow-elevation-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-edge/60 px-4 py-3">
              <div>
                <p className="text-body font-medium text-snow">Reports · Summary</p>
                <p className="text-caption text-iron-veil">1 – 31 Oct 2026</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-buttons border border-slate-edge px-3 py-1.5 text-caption text-snow">
                <Download className="h-3.5 w-3.5" /> Export PDF
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 border-b border-slate-edge/60 px-4 py-4">
              {[
                ['Total hours', '163.2'],
                ['Billable', '148.5'],
                ['Amount', '$12,480.00'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-caption text-iron-veil">{k}</p>
                  <p className="mt-0.5 text-body-lg font-medium tabular-nums text-snow sm:text-heading-sm">{v}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="text-caption text-iron-veil">
                    <th className="px-4 py-2.5 text-left font-normal">Project</th>
                    <th className="hidden px-4 py-2.5 text-left font-normal sm:table-cell">Client</th>
                    <th className="px-4 py-2.5 text-right font-normal">Hours</th>
                    <th className="px-4 py-2.5 text-right font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-edge/40 text-snow">
                  {[
                    ['Month-end close', 'Harbor & Vale', '62.0', '$4,650.00', '#5683da'],
                    ['VAT & compliance', 'Nightjar Studio', '41.5', '$3,735.00', '#ff8964'],
                    ['Bookkeeping', 'Atlas Freight', '45.0', '$4,095.00', '#95979e'],
                  ].map(([p, c, h, a, color]) => (
                    <tr key={p}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{p}</span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-smoke sm:table-cell">{c}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{h}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <figcaption className="mt-3 text-caption text-smoke">Illustrative report.</figcaption>
        </figure>

        <div className="order-1 lg:order-2">
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-snow [text-wrap:balance]">
            Built for billing, not just timing.
          </h2>
          <ul className="mt-8 space-y-6">
            {ITEMS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-electric-iris" aria-hidden="true" />
                <div>
                  <p className="text-body-lg font-medium text-snow">{title}</p>
                  <p className="mt-1 max-w-[52ch] text-body text-smoke">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
