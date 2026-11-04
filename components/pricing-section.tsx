'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS, PLAN_ORDER, yearlyMonthlyPrice, type PlanDefinition } from '@/lib/plans';

/**
 * Pricing on a light band: Snow cards on Linen, Frost borders, the one
 * highlighted plan in Electric Iris. The monthly/yearly toggle is the only state.
 */

function PlanCard({ plan, yearly }: { plan: PlanDefinition; yearly: boolean }) {
  const price = yearly ? yearlyMonthlyPrice(plan.monthlyPrice) : plan.monthlyPrice;
  const yearlyTotal = plan.monthlyPrice * 10;
  const cta = plan.enterprise ? 'Contact sales' : 'Start free trial';
  const href = plan.enterprise ? 'mailto:hello@getora.app' : '/auth/signup';

  return (
    <li className="relative flex w-full flex-col sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
      {plan.highlight && (
        <span className="absolute -top-3 left-6 rounded-tags bg-ember-pulse px-3 py-1 text-caption font-medium text-void">
          Most popular
        </span>
      )}
      <div
        className={`flex flex-1 flex-col rounded-cards bg-snow p-6 sm:p-7 ${
          plan.highlight ? 'border-2 border-electric-iris' : 'border border-frost'
        }`}
      >
        <p className="text-body font-medium text-void">{plan.name}</p>
        <p className="mt-0.5 text-body text-iron-veil">{plan.description}</p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.04em] text-void tabular-nums">${price}</span>
          <span className="text-body text-iron-veil">/month</span>
        </div>
        <p className="mt-1.5 h-5 text-caption text-iron-veil">
          {yearly && plan.monthlyPrice > 0 ? `Billed $${yearlyTotal}/year` : plan.monthlyPrice === 0 ? 'Free forever' : 'Billed monthly'}
        </p>

        <p className="mt-5 border-y border-linen py-3 text-body text-void">{plan.seatsLabel}</p>

        <ul className="mb-7 mt-4 flex-1 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-body text-iron-veil">
              <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-electric-iris" aria-hidden="true" />
              {f}
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
      <div className="mx-auto max-w-[var(--page-max-width)] px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-void [text-wrap:balance]">
              Simple pricing.
            </h2>
            <p className="mt-3 max-w-[48ch] text-body-lg text-iron-veil">
              Start free. Pay when you need more people or the integrations.
            </p>
          </div>

          {/* monthly / yearly */}
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

        <ul className="mt-12 flex flex-wrap justify-center gap-5">
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
