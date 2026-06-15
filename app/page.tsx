import Link from 'next/link';
import { CheckCircle, Send } from 'lucide-react';
import { OriginLink } from '@/components/ui/origin-button';
import { PerspectiveClockHero, SparklesCore } from './components/HeroClient';

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
    icon: <span className="text-4xl">⏱</span>,
    title: 'Track time',
    desc: 'One-click timer, manual entry, and team tracking. Works across projects and clients.',
  },
  {
    icon: <span className="text-4xl">✅</span>,
    title: 'Approve periods',
    desc: 'Weekly, bi-weekly, or monthly billing cycles. Review, approve, and lock with one click.',
  },
  {
    icon: <Send className="w-9 h-9 text-[#FFE600]" />,
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
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#050c1b' }}>
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

      {/* Hero — text only, no sparkles */}
      <section className="bg-[#050c1b] pt-32 pb-0">
        <div className="text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Time tracker for<br />
            <span className="bg-gradient-to-r from-[#FFE600] via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
              Freelancers and More
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track hours. Approve periods. Push to QuickBooks or Xero automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
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
          <p className="text-slate-600 text-sm mb-10">No credit card required · Free forever on solo plan</p>
        </div>
      </section>

      {/* Clock — full width, no sparkles */}
      <div className="relative w-full bg-[#050c1b]" style={{ height: '480px' }}>
        <PerspectiveClockHero />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #050c1b)' }} />
      </div>

      {/* Sparkle strip below the clock */}
      <div className="relative w-full h-48 bg-black overflow-hidden">
        {/* Glow lines */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm mx-auto" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4 mx-auto" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm mx-auto" />
        {/* Sparkles */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.5}
        />
        {/* Radial fade */}
        <div
          className="absolute inset-0 w-full h-full bg-black pointer-events-none"
          style={{ maskImage: 'radial-gradient(350px 200px at top, transparent 20%, white)' }}
        />
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
                <div className="mb-5">{f.icon}</div>
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
      <footer style={{ background: '#050c1b' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-4 border-b border-white/5">
          <OraLogo />
          <div className="flex gap-6">
            <Link href="/auth/signin" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Sign up
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center">
          <p className="text-slate-500 text-sm">© 2026 ORA · Powered by Fiscus LLC</p>
        </div>
      </footer>
    </div>
  );
}
