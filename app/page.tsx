import Link from 'next/link';
import { SiQuickbooks, SiXero } from 'react-icons/si';
import { OriginLink } from '@/components/ui/origin-button';
import { PerspectiveClockHero, FeaturesShowcase } from './components/HeroClient';
import { OraReveal } from '@/components/ui/ora-reveal';
import { PricingSection } from '@/components/pricing-section';

const BG = '#F5F4EF';

function OraLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width={44} height={44} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#FFE600" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="10" stroke="#FFE600" strokeWidth="1.5" />
        <line x1="16" y1="8" x2="16" y2="16" stroke="#FFE600" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="16" x2="21" y2="19" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.5" fill="#FFE600" />
      </svg>
      <span className="text-2xl font-black tracking-tight text-slate-900">ORA</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: BG }}>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <OraLogo />
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">Get started</Link>
        </div>
      </nav>

      {/* ORA Reveal — above clock */}
      <div className="pt-24" style={{ background: BG }}>
        <OraReveal />
      </div>

      {/* Clock — larger, with glow */}
      <div className="relative w-full" style={{ height: '520px', background: BG }}>
        <PerspectiveClockHero />
      </div>

      {/* Hero heading + CTAs */}
      <section className="py-16" style={{ background: BG }}>
        <div className="text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
            Time tracker for<br />
            <span className="bg-gradient-to-r from-yellow-500 via-amber-400 to-emerald-500 bg-clip-text text-transparent">
              Freelancers and More
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track hours. Approve periods. Push to QuickBooks or Xero automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
            <OriginLink href="/auth/signup" className="px-8 py-4 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl text-base transition-colors">
              Start free
            </OriginLink>
            <OriginLink href="#features" className="px-8 py-4 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-base transition-colors">
              See how it works
            </OriginLink>
          </div>
          <p className="text-slate-400 text-sm mb-10">No credit card required</p>

          {/* Integrates with — react-icons */}
          <div className="flex items-center justify-center gap-10 mt-2">
            <p className="text-sm text-slate-400">Integrates with</p>
            <div className="flex flex-col items-center gap-1.5">
              <SiQuickbooks size={40} className="text-green-600" />
              <span className="text-xs font-medium text-slate-500">QuickBooks Online</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <SiXero size={40} className="text-sky-500" />
              <span className="text-xs font-medium text-slate-500">Xero</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-4">Everything you need to bill clients</h2>
          <p className="text-slate-500 text-center mb-16 text-lg">From first click to paid invoice, ORA handles the whole workflow.</p>
          <FeaturesShowcase />
        </div>
      </section>

      {/* Pricing */}
      <div style={{ background: BG }}>
        <PricingSection />
      </div>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to stop losing billable hours?</h2>
          <p className="text-slate-400 mb-8">Join freelancers and agencies who trust ORA to track time and get paid on time.</p>
          <OriginLink href="/auth/signup" className="inline-block px-10 py-4 bg-[#FFE600] hover:bg-yellow-300 text-black font-bold rounded-xl text-lg transition-colors">
            Create your free workspace
          </OriginLink>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: BG }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-4 border-b border-slate-200">
          <OraLogo />
          <div className="flex gap-6">
            <Link href="/auth/signin" className="text-slate-400 hover:text-slate-700 text-sm transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="text-slate-400 hover:text-slate-700 text-sm transition-colors">Sign up</Link>
          </div>
        </div>
        <div className="border-t border-slate-200 py-6 text-center">
          <p className="text-slate-400 text-sm">2026 ORA &middot; Powered by Fiscus LLC</p>
        </div>
      </footer>
    </div>
  );
}
