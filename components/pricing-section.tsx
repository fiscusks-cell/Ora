'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS, PLAN_ORDER, yearlyMonthlyPrice, type PlanDefinition } from '@/lib/plans';

/**
 * Pricing on a light band: five equal columns from 1280 up; below that the
 * content width cannot hold five, so the cards drop to two rows of equal
 * width on the same grid (3 + 2 at 1024, 2 + 2 + 1 at 768, one column on a
 * phone). The monthly/yearly toggle is the only state.
 */

function PlanCard({ plan, yearly }: { plan: PlanDefinition; yearly: boolean }) {
  const price = yearly ? yearlyMonthlyPrice(plan.monthlyPrice) : plan.monthlyPrice;
  const yearlyTotal = plan.monthlyPrice * 10;
  const cta = plan.enterprise ? 'Contact sales' : 'Start free trial';
  const href = plan.enterprise ? 'mailto:hello@getora.app' : '/auth/signup';

  return (
    <li className="relative flex flex-col">
      {plan.highlight && (
        <span className="absolute -top-3 left-5 rounded-tags bg-ember-pulse px-3 py-1 text-caption font-medium text-void">
          Most popular
        </span>
      )}
      <div className={`flex flex-1 flex-col rounded-cards bg-snow p-5 ${plan.highlight ? 'border-2 border-electric-iris' : 'border border-frost'}`}>
        <p className="text-body font-medium text-void">{plan.name}</p>
        <p className="mt-0.5 min-h-[2.5rem] text-body text-iron-veil">{plan.description}</p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-[2.25rem] font-bold leading-none tracking-[-0.025em] text-void tabular-nums">${price}</span>
          <span className="text-caption text-iron-veil">/month</span>
        </div>
        <p className="mt-1.5 text-caption text-iron-veil">
          {yearly && plan.monthlyPrice > 0 ? `Billed $${yearlyTotal}/year` : plan.monthlyPrice === 0 ? 'Free forever' : 'Billed monthly'}
        </p>

        <p className="mt-4 border-y border-linen py-2.5 text-body text-void">{plan.seatsLabel}</p>

        <ul className="mb-6 mt-3 flex-1 space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-body text-iron-veil">
              <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-electric-iris" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className={`block rounded-buttons py-2.5 text-center text-body font-medium transition-[background-color,color,border-color,box-shadow] duration-200 ${
            plan.highlight
              ? 'bg-electric-iris text-snow hover:bg-[var(--accent-hover)] hover:shadow-[0_0_0_4px_rgba(86,131,218,0.18)]'
              : 'border border-frost text-void hover:border-void'
          }`}
        >
          {cta}
        </Link>
      </div>
    </li>
  );
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="scroll-mt-20 bg-[var(--surface-linen)] text-void">
      <div className="mx-auto max-w-[1216px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-[clamp(2.25rem,4.6vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.025em] text-void [text-wrap:balance]">
              Simple pricing.
            </h2>
            <p className="mt-4 max-w-[48ch] text-subheading text-iron-veil">
              Start free. Pay when you need more people or the integrations.
            </p>
          </div>

          <div className="inline-flex self-start rounded-buttons border border-frost bg-snow p-1 md:self-auto" role="group" aria-label="Billing period">
            <button
              type="button"
              onClick={() => setYearly(false)}
              aria-pressed={!yearly}
              className={`rounded-buttons px-4 py-1.5 text-body transition-colors ${!yearly ? 'bg-void text-snow' : 'text-iron-veil hover:text-void'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              aria-pressed={yearly}
              className={`inline-flex items-center gap-2 rounded-buttons px-4 py-1.5 text-body transition-colors ${yearly ? 'bg-void text-snow' : 'text-iron-veil hover:text-void'}`}
            >
              Yearly
              <span className={`text-caption ${yearly ? 'text-ember-pulse' : 'text-electric-iris'}`}>2 months free</span>
            </button>
          </div>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PLAN_ORDER.map((key) => (
            <PlanCard key={key} plan={PLANS[key]} yearly={yearly} />
          ))}
        </ul>

        <p className="mt-10 text-center text-caption text-iron-veil">
          All paid plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
