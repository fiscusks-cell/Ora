import { SiQuickbooks } from 'react-icons/si';
import { Check, DollarSign, FileText, Square } from 'lucide-react';

/**
 * The mechanism as three product states in a bento: fixed-height cells, the
 * state filling each cell past its foot, the caption over it. Each state is
 * taller than the space it has, so the caption's gradient crops it the way
 * a screenshot is cropped — nothing ends in empty white. The order is the
 * product's order — track, approve, publish.
 */

function Cell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <li className="relative h-[400px] overflow-hidden rounded-cards border border-frost bg-snow text-void lg:h-[420px]">
      {/* the product state: full width, cropped by the caption's gradient */}
      <div className="absolute inset-x-0 top-0">{children}</div>
      {/* a fixed-height caption box, so every title starts at the same line
          whatever its body wraps to. The gradient's ramp is its top 60px; the
          title starts below the ramp, on solid Snow, so no row shows through it */}
      <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-snow from-70% via-snow/95 via-80% to-snow/0 px-6 pt-16">
        <h3 className="font-display text-heading-sm font-bold tracking-[-0.025em] text-void">{title}</h3>
        <p className="mt-1.5 max-w-[40ch] text-body text-iron-veil">{body}</p>
      </div>
    </li>
  );
}

const rowCls = 'flex justify-between gap-3 py-2';

/** A slice of the timer page on the light surface. */
function TrackState() {
  const rows = [
    { desc: 'Reconcile bank feed', client: 'Harbor & Vale', color: '#5683da', dur: '1:52' },
    { desc: 'Q3 VAT return', client: 'Nightjar Studio', color: '#ff8964', dur: '1:25' },
    { desc: 'Receipts capture', client: 'Atlas Freight', color: '#95979e', dur: '0:51' },
    { desc: 'Payroll journal', client: 'Harbor & Vale', color: '#5683da', dur: '3:15' },
    { desc: 'AR aging review', client: 'Nightjar Studio', color: '#ff8964', dur: '4:21' },
    { desc: 'Trial balance review', client: 'Harbor & Vale', color: '#5683da', dur: '2:40' },
  ];
  return (
    <div className="text-void">
      {/* the running bar: the counter wraps onto its own line in a narrow cell */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linen px-5 py-3">
        <p className="min-w-0 flex-[1_1_140px] truncate text-body text-void">Reconcile bank feed</p>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <DollarSign className="h-4 w-4 text-electric-iris" aria-label="Billable" />
          <span className="text-body-lg font-medium tabular-nums text-electric-iris">0:42:17</span>
          <span className="inline-flex items-center gap-1 rounded-buttons bg-[var(--error)] px-3 py-1 text-caption font-medium text-snow">
            <Square className="h-2.5 w-2.5" /> Stop
          </span>
        </div>
      </div>
      <ul className="divide-y divide-linen">
        {rows.map((r) => (
          <li key={r.desc} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{r.desc}</p>
              <p className="flex items-center gap-1.5 text-caption text-iron-veil">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />
                {r.client}
              </p>
            </div>
            <span className="text-body tabular-nums">{r.dur}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The period review before approval. */
function ApproveState() {
  return (
    <div className="px-5 pt-4 text-void">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body font-medium">October 2026</p>
        <span className="shrink-0 rounded-tags bg-ember-pulse/12 px-2.5 py-1 text-caption font-medium text-molasses">Pending approval</span>
      </div>
      <p className="mt-0.5 text-caption text-iron-veil">Billing period · 2 clients · 3 people</p>
      <dl className="mt-3 divide-y divide-linen border-y border-linen text-body">
        <div className={rowCls}><dt className="text-iron-veil">Harbor &amp; Vale</dt><dd className="tabular-nums">31.5 h · $2,362.50</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Nightjar Studio</dt><dd className="tabular-nums">12.0 h · $1,080.00</dd></div>
        <div className={`${rowCls} font-medium`}><dt>Total</dt><dd className="tabular-nums">43.5 h · $3,442.50</dd></div>
      </dl>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-buttons bg-electric-iris px-4 py-2 text-body font-medium text-snow">
        <Check className="h-3.5 w-3.5" />
        Approve period
      </span>
      <p className="mt-5 text-caption text-iron-veil">By person</p>
      <dl className="mt-1.5 divide-y divide-linen border-y border-linen text-body">
        <div className={rowCls}><dt className="text-iron-veil">Rina Kelmendi</dt><dd className="tabular-nums">18.0 h · $1,350.00</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Arben Hoxha</dt><dd className="tabular-nums">14.5 h · $1,087.50</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Lule Berisha</dt><dd className="tabular-nums">11.0 h · $1,005.00</dd></div>
      </dl>
    </div>
  );
}

/** The invoice as it lands in the books. */
function PublishState() {
  return (
    <div className="px-5 pt-4 text-void">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-iron-veil">INV-0147 · Harbor &amp; Vale</p>
          <p className="mt-1 font-display text-display-sm font-bold tabular-nums tracking-[-0.025em]">$2,362.50</p>
        </div>
        <span className="shrink-0 rounded-tags bg-electric-iris/12 px-2.5 py-1 text-caption font-medium text-electric-iris">Issued</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-iron-veil">
        <span className="inline-flex items-center gap-1.5"><SiQuickbooks className="h-3.5 w-3.5" /> QuickBooks Online</span>
        <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Time report attached</span>
      </div>
      <dl className="mt-4 divide-y divide-linen border-y border-linen text-body">
        <div className={rowCls}><dt className="text-iron-veil">Reconcile bank feed</dt><dd className="tabular-nums">12.5 h · $937.50</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Payroll journal</dt><dd className="tabular-nums">10.0 h · $750.00</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Trial balance review</dt><dd className="tabular-nums">9.0 h · $675.00</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Hours</dt><dd className="tabular-nums">31.5 h</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Rate</dt><dd className="tabular-nums">$75.00 / h</dd></div>
        <div className={rowCls}><dt className="text-iron-veil">Due</dt><dd className="tabular-nums">4 Dec 2026</dd></div>
      </dl>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-[var(--surface-linen)] text-void">
      <div className="mx-auto max-w-[1216px] px-5 pb-20 pt-24 sm:px-8 lg:pb-28 lg:pt-32">
        <h2 className="font-display text-[clamp(2.25rem,4.6vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.025em] text-void [text-wrap:balance]">
          From timer to invoice, in three moves.
        </h2>
        <p className="mt-5 max-w-[60ch] text-subheading text-iron-veil">
          Hours are tracked by the people doing the work, approved once as a billing period, and published as one invoice per client — in the accounting system, not beside it.
        </p>

        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          <Cell title="Track" body="Members start a timer against a client project. The server keeps the clock, so billable time is never trusted from a browser.">
            <TrackState />
          </Cell>
          <Cell title="Approve" body="An owner or admin reviews the period as one unit — every client, every person — and approves it once.">
            <ApproveState />
          </Cell>
          <Cell title="Publish" body="One invoice per client lands in QuickBooks Online or Xero with the PDF time report attached — and never twice, even on a retry.">
            <PublishState />
          </Cell>
        </ol>
      </div>
    </section>
  );
}
