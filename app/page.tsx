/*
 * DIRECTION — the landing page
 *
 * THESIS: Prove the mechanism, don't illustrate the category. A running timer at
 * the top of one aurora beam becomes an issued invoice at the bottom. Refused:
 * the clock illustration, the gradient headline, the icon-card grid.
 *
 * OWN-WORLD: Void and Obsidian canvas, Charcoal cards with Slate Edge borders,
 * pill controls, Sora display at tight tracking over Inter body; Electric Iris is
 * the one action color, Ember Pulse only as punctuation and the beam's warm stop.
 * Light bands in Linen/Snow alternate with the dark ones.
 *
 * STORY: A firm owner or a freelancer lands, sees the product running inside the
 * beam, reads that hours become invoices in the books, believes it because the
 * workflow is shown as real states with real integrations, and starts free.
 *
 * FIRST VIEWPORT: nav; headline left (two lines, display face), subhead, two pill
 * CTAs, the integrations row; the product mockup on the right, over the beam,
 * its counter ticking. Primary action: "Start free".
 *
 * FORM: Persuade. Hero → How it works (light) → Capabilities (dark) → Pricing
 * (light) → Close (dark) → Footer. Code-led; the beam entrance and the live
 * counter are the page's single authored motion.
 */
import Link from 'next/link';
import { SiQuickbooks, SiXero } from 'react-icons/si';
import { MarketingNav } from './components/landing/MarketingNav';
import { MarketingFooter } from './components/landing/MarketingFooter';
import { AuroraBeam } from './components/landing/AuroraBeam';
import { ProductMockup } from './components/landing/ProductMockup';
import { HowItWorks } from './components/landing/HowItWorks';
import { Capabilities } from './components/landing/Capabilities';
import { PricingSection } from '@/components/pricing-section';

const primaryPill =
  'inline-flex items-center justify-center rounded-buttons bg-electric-iris px-7 py-3.5 text-body-lg font-medium text-snow transition-[background-color,box-shadow] duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_0_0_4px_rgba(86,131,218,0.22),0_10px_30px_rgba(86,131,218,0.4)]';
const ghostPill =
  'inline-flex items-center justify-center rounded-buttons border border-slate-edge px-7 py-3.5 text-body-lg font-medium text-snow transition-colors duration-200 hover:border-snow hover:bg-snow hover:text-void';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-snow">
      <MarketingNav tone="dark" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-void">
        <AuroraBeam />
        <div className="relative mx-auto grid max-w-[var(--page-max-width)] items-center gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-40">
          <div className="rise-in max-w-[640px]">
            <h1 className="font-display text-[clamp(2.75rem,6.4vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-snow [text-wrap:balance]">
              Time, tracked. Invoices, done.
            </h1>
            <p className="mt-6 max-w-[52ch] text-subheading text-smoke">
              ORA turns the hours you track into client invoices in QuickBooks Online or Xero — approved as a billing period, one invoice per client, with the time report attached. For firms that bill by the hour, and the freelancers who do too.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/signup" className={primaryPill}>Start free</Link>
              <Link href="#how" className={ghostPill}>See how it works</Link>
            </div>
            <p className="mt-4 text-caption text-smoke">Free plan · no credit card</p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-smoke">
              <span className="text-caption">Publishes to</span>
              <span className="inline-flex items-center gap-2 text-body"><SiQuickbooks className="h-5 w-5" aria-hidden="true" /> QuickBooks Online</span>
              <span className="inline-flex items-center gap-2 text-body"><SiXero className="h-5 w-5" aria-hidden="true" /> Xero</span>
            </div>
          </div>

          <div className="rise-in w-full lg:justify-self-end" style={{ animationDelay: '120ms' }}>
            <ProductMockup />
          </div>
        </div>
      </section>

      <HowItWorks />
      <Capabilities />
      <PricingSection />

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="bg-void text-snow">
        <div className="mx-auto max-w-[var(--page-max-width)] px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-[720px]">
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.035em] text-snow [text-wrap:balance]">
              Close the month with every hour invoiced.
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/signup" className={primaryPill}>Create your workspace</Link>
              <span className="text-body text-smoke">Free plan · no credit card</span>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
