'use client';
import { useState } from 'react';
import Link from 'next/link';

// ─── palette ─────────────────────────────────────────────────────────────────

const C = {
  canvas:  '#f8f7f4',
  card:    '#ffffff',
  border:  '#d4d6cf',
  text:    '#1a1f26',
  muted:   '#8b95a1',
  indigo:  '#4f46e5',
  indigoH: '#4338ca',
} as const;

// ─── data ────────────────────────────────────────────────────────────────────

interface Plan {
  name: string;
  monthlyPrice: number;
  desc: string;
  seats: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
  enterprise: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'FREE',
    monthlyPrice: 0,
    desc: 'For trying ORA out',
    seats: '1 user',
    features: ['3 projects', 'Time tracking', 'CSV export'],
    cta: 'Start free trial',
    href: '/auth/signup',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'PRO',
    monthlyPrice: 12,
    desc: 'For solo freelancers',
    seats: '3 users',
    features: ['Unlimited projects', 'QuickBooks Online', 'Xero (coming soon)', 'PDF reports', 'Priority support'],
    cta: 'Start free trial',
    href: '/auth/signup',
    highlight: true,
    enterprise: false,
  },
  {
    name: 'TEAM',
    monthlyPrice: 49,
    desc: 'For growing firms',
    seats: '15 users',
    features: ['Everything in Pro', 'Team messaging', 'Project boards', 'Team analytics'],
    cta: 'Start free trial',
    href: '/auth/signup',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'ADVANCED',
    monthlyPrice: 99,
    desc: 'For established practices',
    seats: 'Unlimited users',
    features: ['Everything in Team', 'Custom invoice branding', 'API access', 'Advanced permissions'],
    cta: 'Start free trial',
    href: '/auth/signup',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'ENTERPRISE',
    monthlyPrice: 249,
    desc: 'For large organisations',
    seats: 'Unlimited users',
    features: ['Everything in Advanced', 'SSO', 'Dedicated support', 'SLA'],
    cta: 'Contact sales',
    href: 'mailto:hello@getora.app',
    highlight: false,
    enterprise: true,
  },
];

function yearlyPerMonth(monthly: number): number {
  if (monthly === 0) return 0;
  return Math.round((monthly * 10) / 12);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
      <path d="M2 6.5l3 3 6-6" stroke={C.indigo} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PlanCardProps {
  plan: Plan;
  yearly: boolean;
}

function PlanCard({ plan, yearly }: PlanCardProps) {
  const price = yearly ? yearlyPerMonth(plan.monthlyPrice) : plan.monthlyPrice;
  const yearlyTotal = plan.monthlyPrice * 10;

  return (
    <div className="w-full sm:w-[calc(50%-10px)] lg:w-72 flex-shrink-0 flex flex-col">
      {/* "Most popular" label — consistent height on every card */}
      <div className="h-7 flex items-end justify-center pb-1.5">
        {plan.highlight && (
          <span
            className={`text-[11px] tracking-[-0.02em]`}
            style={{ color: C.indigo }}
          >
            Most popular
          </span>
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-[20px] p-8 flex flex-col"
        style={{
          background: C.card,
          border: plan.highlight ? `2px solid ${C.indigo}` : `1px solid ${C.border}`,
        }}
      >
        {/* Plan name */}
        <p
          className={`text-[12px] tracking-[0.04em] mb-4`}
          style={{ color: C.muted }}
        >
          {plan.name}
        </p>

        {/* Price */}
        <div className="mb-1 flex items-end gap-1">
          <span
            className={`text-[48px] leading-none tracking-[-0.04em]`}
            style={{ color: C.text }}
          >
            ${price}
          </span>
          <span
            className={`text-[13px] tracking-[-0.02em] pb-1`}
            style={{ color: C.muted }}
          >
            /month
          </span>
        </div>
        {yearly && plan.monthlyPrice > 0 && (
          <p
            className={`text-[11px] tracking-[-0.02em] mb-1`}
            style={{ color: C.muted }}
          >
            billed ${yearlyTotal}/year
          </p>
        )}

        {/* Description */}
        <p
          className={`text-[14px] leading-normal tracking-[-0.001em] font-normal mt-2 mb-6`}
          style={{ color: C.muted }}
        >
          {plan.desc}
        </p>

        {/* Seat count — visually distinct from feature list */}
        <div
          className="py-3 mb-5"
          style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
        >
          <span
            className={`text-[14px] tracking-[-0.02em]`}
            style={{ color: C.text }}
          >
            {plan.seats}
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-8">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <CheckIcon />
              <span
                className={`text-[14px] leading-normal tracking-[-0.001em] font-normal`}
                style={{ color: C.muted }}
              >
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={plan.href}
          className={`block text-center text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors`}
          style={
            plan.highlight
              ? { background: C.indigo, color: '#ffffff' }
              : { border: `1px solid ${C.border}`, color: C.muted }
          }
          onMouseEnter={
            plan.highlight
              ? (e) => (e.currentTarget.style.background = C.indigoH)
              : (e) => {
                  e.currentTarget.style.borderColor = C.text;
                  e.currentTarget.style.color = C.text;
                }
          }
          onMouseLeave={
            plan.highlight
              ? (e) => (e.currentTarget.style.background = C.indigo)
              : (e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.muted;
                }
          }
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <p
          className={`text-[12px] tracking-[0.06em] text-center mb-3`}
          style={{ color: C.indigo }}
        >
          PRICING
        </p>

        {/* Heading */}
        <h2
          className={`text-[40px] md:text-[48px] leading-tight tracking-[-0.022em] font-normal text-center mb-3`}
          style={{ color: C.text }}
        >
          Simple, transparent pricing
        </h2>
        <p
          className={`text-[18px] leading-normal tracking-[-0.001em] font-normal text-center mb-10`}
          style={{ color: C.muted }}
        >
          Start free. Upgrade when you need more users or integrations.
        </p>

        {/* Monthly / Yearly toggle */}
        <div className="flex justify-center mb-14">
          <div
            className="flex items-center p-1 rounded-[8px] gap-1"
            style={{ border: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => setYearly(false)}
              className={`text-[13px] tracking-[-0.02em] px-4 py-1.5 rounded-[6px] transition-colors`}
              style={
                !yearly
                  ? { background: C.text, color: '#ffffff' }
                  : { color: C.muted }
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`text-[13px] tracking-[-0.02em] px-4 py-1.5 rounded-[6px] transition-colors flex items-center gap-2`}
              style={
                yearly
                  ? { background: C.text, color: '#ffffff' }
                  : { color: C.muted }
              }
            >
              Yearly
              <span
                className="text-[11px] tracking-[-0.01em]"
                style={{ color: yearly ? 'rgba(199,210,254,0.9)' : C.indigo }}
              >
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Cards — flex-wrap: 3 per row on lg+, 2 on sm, 1 on mobile */}
        <div className="flex flex-wrap gap-5 justify-center">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} yearly={yearly} />
          ))}
        </div>

        {/* Footnote */}
        <p
          className={`text-center text-[12px] tracking-[-0.02em] mt-10`}
          style={{ color: C.muted }}
        >
          All paid plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
