import { SiQuickbooks, SiXero } from 'react-icons/si';
import { Check, DollarSign, FileText } from 'lucide-react';

/**
 * The mechanism, shown as three real product states on a light band. The order
 * is the product's order — track, approve, publish — so the row reads left to
 * right along a thin iris→ember rule, the beam's colors told quietly.
 */

function Stage({ title, children, body }: { title: string; children: React.ReactNode; body: string }) {
  return (
    // Each stage spans the list's two rows through a subgrid, so all three cards
    // share row one and all three titles start row two — equal card heights and
    // aligned titles at every width, whatever the body copy wraps to.
    <li className="relative flex flex-col gap-5 md:row-span-2 md:grid md:grid-rows-subgrid md:gap-5">
      <div className="rounded-cards border border-frost bg-snow p-5 text-void shadow-elevation-sm">{children}</div>
      <div>
        <h3 className="font-display text-heading-sm font-semibold text-void">{title}</h3>
        <p className="mt-2 max-w-[42ch] text-body text-iron-veil">{body}</p>
      </div>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-[var(--surface-linen)] text-void">
      <div className="mx-auto max-w-[var(--page-max-width)] px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-void [text-wrap:balance]">
          From timer to invoice, in three moves.
        </h2>
        <p className="mt-4 max-w-[60ch] text-body-lg text-iron-veil">
          Hours are tracked by the people doing the work, approved once as a billing period, and published as one invoice per client — in the accounting system, not beside it.
        </p>

        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:grid-rows-[auto_auto] md:gap-x-8 md:gap-y-5">
          {/* the rule that ties the three states together */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[104px] hidden h-px md:block"
            style={{ background: 'linear-gradient(90deg, var(--color-electric-iris), var(--color-ember-pulse))', opacity: 0.6 }}
          />

          <Stage
            title="Track"
            body="Members start a timer against a client project. The server keeps the clock, so billable time is never trusted from a browser."
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-void">Reconcile bank feed</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-caption text-iron-veil">
                  <span className="h-1.5 w-1.5 rounded-full bg-electric-iris" />
                  Harbor &amp; Vale
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-electric-iris" aria-label="Billable" />
              <span className="text-body-lg font-medium tabular-nums text-electric-iris">0:42:17</span>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-linen">
              <div className="h-full w-[64%] rounded-full bg-electric-iris" />
            </div>
          </Stage>

          <Stage
            title="Approve"
            body="An owner or admin reviews the period as one unit — every client, every person — and approves it once."
          >
            <div className="flex items-center justify-between">
              <p className="text-body font-medium text-void">October 2026</p>
              <span className="rounded-tags bg-ember-pulse/12 px-2.5 py-1 text-caption font-medium text-molasses">Pending approval</span>
            </div>
            <dl className="mt-3 divide-y divide-linen text-body">
              <div className="flex justify-between py-1.5"><dt className="text-iron-veil">Harbor &amp; Vale</dt><dd className="tabular-nums text-void">31.5 h · $2,362.50</dd></div>
              <div className="flex justify-between py-1.5"><dt className="text-iron-veil">Nightjar Studio</dt><dd className="tabular-nums text-void">12.0 h · $1,080.00</dd></div>
              <div className="flex justify-between py-1.5 font-medium"><dt className="text-void">Total</dt><dd className="tabular-nums text-void">43.5 h · $3,442.50</dd></div>
            </dl>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-buttons bg-electric-iris px-3.5 py-1.5 text-body font-medium text-snow">
              <Check className="h-3.5 w-3.5" />
              Approve period
            </span>
          </Stage>

          <Stage
            title="Publish"
            body="One invoice per client lands in QuickBooks Online or Xero with the PDF time report attached — and never twice, even on a retry."
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption text-iron-veil">INV-0147</p>
                <p className="text-body font-medium text-void">Harbor &amp; Vale</p>
              </div>
              <span className="rounded-tags bg-electric-iris/12 px-2.5 py-1 text-caption font-medium text-electric-iris">Issued</span>
            </div>
            <p className="mt-3 font-display text-heading font-semibold tabular-nums tracking-[-0.02em] text-void">$2,362.50</p>
            <div className="mt-3 flex items-center gap-2 text-caption text-iron-veil">
              <FileText className="h-3.5 w-3.5" />
              Time report attached · 31.5 h
            </div>
            <div className="mt-3 flex items-center gap-4 border-t border-linen pt-3 text-iron-veil">
              <span className="inline-flex items-center gap-1.5 text-caption"><SiQuickbooks className="h-4 w-4" /> QuickBooks Online</span>
              <span className="inline-flex items-center gap-1.5 text-caption"><SiXero className="h-4 w-4" /> Xero</span>
            </div>
          </Stage>
        </ol>
      </div>
    </section>
  );
}
