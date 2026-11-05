/*
 * DIRECTION — the landing page
 *
 * THESIS: Prove the mechanism, don't illustrate the category. A beam of light
 * lands on the running product; below, the same workflow is shown as real
 * states until it ends as an issued invoice. Refused: the clock illustration,
 * the gradient headline, the icon-card grid, screenshots floating in cards.
 *
 * OWN-WORLD: Void and Obsidian canvas, product surfaces in Charcoal with
 * hairline rings, Snow cells on Linen bands, pill controls, Sora display at
 * tight tracking over Inter body; Electric Iris is the one action color,
 * Ember Pulse only as punctuation and the beam's warm reach.
 *
 * STORY: A firm owner or a freelancer lands, sees the timer running at full
 * size, reads that hours become invoices in the books, believes it because the
 * workflow is shown as states with real integrations, and starts free.
 *
 * FIRST VIEWPORT (≥1024; the hero is 100vw tall, 1440px at 1440 — the
 * reference's 1438): copy top-left in a 560px column; behind everything the
 * beam clip (a generated light beam with drifting fog on true black) under
 * `lighten`, 133vw wide, its core at 56.8% of the viewport, bleeding past both
 * edges; the product frame min(70vw, 1100px) wide at 1:1, centred on that x,
 * its top border on the clip's flare line (61.93vw) so the light reads as
 * hitting the window, running to the foot through the 300px dissolve into the
 * next band's Linen. Below 1024 the clip is off and the product sits under the
 * copy at full width. Primary action: "Start free".
 *
 * FORM: Persuade. Hero → How it works (light bento) → Capabilities (dark, the
 * report bleeding right) → Pricing (light) → Close (dark) → Footer. The beam
 * clip and the live counter are the page's only motion; under
 * prefers-reduced-motion the clip stays on its poster (the counter still ticks).
 */
import Link from 'next/link';
import { SiQuickbooks, SiXero } from 'react-icons/si';
import { MarketingNav } from './components/landing/MarketingNav';
import { MarketingFooter } from './components/landing/MarketingFooter';
import { HeroVideo } from './components/landing/HeroVideo';
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
      <section className="relative isolate overflow-hidden bg-void lg:min-h-[100vw]">
        {/* the beam clip, behind everything; the section's `isolate` is the blend's backdrop */}
        <HeroVideo />
        <div className="relative mx-auto max-w-[1216px] px-5 pt-28 sm:px-8 sm:pt-32">
          {/* the copy: top-anchored; from lg the beam runs down to its right, to the product below */}
          <div data-hero-copy className="rise-in relative z-10 max-w-[560px]">
            <h1 className="font-display text-[clamp(2.75rem,5.8vw,5.25rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-snow [text-wrap:balance]">
              Time, tracked. Invoices, done.
            </h1>
            <p className="mt-6 max-w-[46ch] text-subheading text-smoke">
              ORA turns the hours you track into client invoices in QuickBooks Online or Xero — approved as a billing period, one invoice per client, with the time report attached. For firms that bill by the hour, and the freelancers who do too.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/signup" className={primaryPill}>Start free</Link>
              <Link href="#how" className={ghostPill}>See how it works</Link>
            </div>
            <p className="mt-4 text-caption text-smoke">Free plan · no credit card</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-smoke">
              <span className="text-caption">Publishes to</span>
              <span className="inline-flex items-center gap-2 text-body"><SiQuickbooks className="h-5 w-5" aria-hidden="true" /> QuickBooks Online</span>
              <span className="inline-flex items-center gap-2 text-body"><SiXero className="h-5 w-5" aria-hidden="true" /> Xero</span>
            </div>
          </div>
        </div>

        {/* the product: under the copy at full width below lg. From lg an absolute frame,
            min(70vw, 1100px) wide and centred on the beam's x, its top border on the
            clip's flare line (globals.css .hero-product), running to the hero's foot
            where the dissolve crops it; above the clip, so the glow reads as behind
            the window */}
        <div className="hero-product rise-in relative z-10 mx-auto mt-14 w-full max-w-[1216px] px-5 sm:px-8 lg:absolute lg:mt-0 lg:max-w-none lg:px-0" style={{ animationDelay: '120ms' }}>
          <ProductMockup />
        </div>

        {/* the dissolve into the next band — to its Linen, so no line appears at the boundary */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[300px] bg-gradient-to-b from-transparent to-[var(--surface-linen)]" />
      </section>

      <HowItWorks />
      <Capabilities />
      <PricingSection />

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="bg-void text-snow">
        <div className="mx-auto max-w-[1216px] px-5 py-24 sm:px-8 lg:py-32">
          <div className="max-w-[760px]">
            <h2 className="font-display text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-snow [text-wrap:balance]">
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
