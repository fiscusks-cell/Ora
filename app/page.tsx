import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CheckCircle } from 'lucide-react';
import { OriginLink } from '@/components/ui/origin-button';

const PerspectiveClockHero = dynamic(() => import('./components/PerspectiveClockHero'), { ssr: false });
const SparklesCore = dynamic(() => import('@/components/ui/sparkles').then(m => ({ default: m.SparklesCore })), { ssr: false });

function OraLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#FFE600" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="10" stroke="#FFE600" strokeWidth="1.5" />
        <line x1="16" y1="8" x2="16" y2="16" stroke="#FFE600" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="16" x2="21" y2="19" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.5" fill="#FFE600" />
      </svg>
      <span className="text-xl font-black tracking-tight text-white">ORA</span>
    </div>
  );
}

const features = [
  {
    icon: '⏱',
    title: 'Track time',
    desc: 'One-click timer, manual entry, and team tracking. Works across projects and clients.',
  },
  {
    icon: '✅',
    title: 'Approve periods',
    desc: 'Weekly, bi-weekly, or monthly billing cycles. Review, approve, and lock with one click.',
  },
  {
    icon: '🚀',
    title: 'Push to QBO / Xero',
    desc: 'Creates a real invoice with line items. Attaches a PDF time report. Fully automated.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect to get started',
    features: ['1 user', '3 projects', 'Timer + manual entry', 'Basic reports'],
    cta: 'Get started',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    desc: 'For solo freelancers',
    features: ['1 user', 'Unlimited projects', 'QuickBooks + Xero', 'PDF reports', 'Priority support'],
    cta: 'Start Pro',
    href: '/auth/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    desc: 'For small agencies',
    features: ['Up to 15 users', 'All Pro features', 'Team workload view', 'Approval workflows', 'Admin controls'],
    cta: 'Start Team',
    href: '/auth/signup?plan=team',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#050c1b' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#050c1b]/80 backdrop-blur-md">
        <OraLogo />
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-[#FFE600] hover:bg-yellow-300 text-black text-sm font-bold rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative w-full min-h-screen overflow-hidden bg-[#050c1b]">
        {/* Layer 1 — Yellow sparkles */}
        <div className="absolute inset-0 z-0">
          <SparklesCore
            id="ora-hero-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={80}
            className="w-full h-full"
            particleColor="#FFE600"
            speed={0.8}
          />
        </div>

        {/* Layer 2 — Emerald sparkles for depth */}
        <div className="absolute inset-0 z-0">
          <SparklesCore
            id="ora-hero-sparkles-green"
            background="transparent"
            minSize={0.3}
            maxSize={0.8}
            particleDensity={40}
            className="w-full h-full"
            particleColor="#10B981"
            speed={0.5}
          />
        </div>

        {/* Layer 3 — 3D clock canvas */}
        <div className="absolute inset-0 z-10">
          <PerspectiveClockHero />
        </div>

        {/* Layer 4 — Vignette fade at edges */}
        <div
          className="absolute inset-0 z-20 pointer-events-none bg-[#050c1b]"
          style={{ maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, black 100%)' }}
        />

        {/* Layer 5 — Headline and CTAs */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-xs font-semibold mb-8 uppercase tracking-widest pointer-events-auto">
            Time Tracking · Invoicing · Insights
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 max-w-4xl">
            Time tracker for<br />
            <span className="bg-gradient-to-r from-[#FFE600] via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
              Freelancers and More
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Track hours. Approve periods. Push to QuickBooks or Xero automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center pointer-events-auto">
            <OriginLink
              href="/auth/signup"
              className="px-8 py-4 bg-[#FFE600] hover:bg-yellow-300 text-black font-bold rounded-xl text-base transition-colors"
            >
              Start free →
            </OriginLink>
            <OriginLink
              href="#features"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl text-base transition-colors backdrop-blur-sm"
            >
              See how it works
            </OriginLink>
          </div>
          <p className="text-slate-600 text-sm mt-6">No credit card required · Free forever on solo plan</p>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 px-6" style={{ background: '#050c1b' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">
            Everything you need to bill clients
          </h2>
          <p className="text-slate-400 text-center mb-16 text-lg">
            From first click to paid invoice, ORA handles the whole workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                style={{ background: '#061025' }}
                className="rounded-2xl p-8 hover:scale-[1.02] transition-transform"
              >
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations bar */}
      <section className="py-12 px-6" style={{ background: '#061025' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold mb-8">Works with</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-2xl font-bold text-slate-300">QuickBooks</div>
            <div className="text-slate-700 text-2xl">·</div>
            <div className="text-2xl font-bold text-slate-300">Xero</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" style={{ background: '#050c1b' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-center mb-16 text-lg">
            Start free. Upgrade when you need integrations or team features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{ background: '#061025' }}
                className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? 'ring-2 ring-[#FFE600]' : ''}`}
              >
                <div className="mb-6">
                  <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm pb-1">{plan.period}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{plan.desc}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <OriginLink
                  href={plan.href}
                  className={`block text-center font-bold py-3 rounded-xl text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-[#FFE600] text-black hover:bg-yellow-300'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </OriginLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6" style={{ background: '#050c1b' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to stop losing billable hours?</h2>
          <p className="text-slate-400 mb-8">
            Join freelancers and agencies who trust ORA to track time and get paid on time.
          </p>
          <OriginLink
            href="/auth/signup"
            className="inline-block px-10 py-4 bg-[#FFE600] hover:bg-yellow-300 text-black font-bold rounded-xl text-lg transition-colors"
          >
            Create your free workspace →
          </OriginLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5" style={{ background: '#050c1b' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <OraLogo />
          <p className="text-slate-600 text-sm">© 2026 ORA. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/auth/signin" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
