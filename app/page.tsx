import Link from 'next/link';
import { CheckCircle, Clock, Users, FileText, ArrowRight, Zap, Shield, BarChart2 } from 'lucide-react';

function OraLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="10" stroke="#3730A3" strokeWidth="1.5" />
        <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
      </svg>
      <span className="text-xl font-black tracking-tight text-white">ORA</span>
    </div>
  );
}

function AnimatedTimer() {
  return (
    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
          <span className="text-sm text-emerald-400 font-medium">Recording</span>
        </div>
        <span className="text-xs text-slate-500">Acme Corp · Tax Prep</span>
      </div>
      <div className="text-5xl font-black tabular-nums text-white tracking-tight text-center my-6">
        <span>02</span>
        <span className="timer-colon text-indigo-400">:</span>
        <span>34</span>
        <span className="timer-colon text-indigo-400">:</span>
        <span>17</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          readOnly
          value="Q3 tax research and documentation"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        />
        <button className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
          Stop
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 mb-2">Today</div>
        {[
          { proj: 'Tax Prep', time: '2:34:17', client: 'Acme Corp' },
          { proj: 'Bookkeeping', time: '1:15:42', client: 'Smith LLC' },
          { proj: 'Advisory', time: '0:45:00', client: 'Jones Co.' },
        ].map((e) => (
          <div key={e.proj} className="flex justify-between items-center py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-300">{e.proj}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{e.client}</span>
            </div>
            <span className="text-slate-300 tabular-nums font-mono">{e.time}</span>
          </div>
        ))}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-semibold">TOTAL</span>
          <span className="text-xs text-white font-bold tabular-nums font-mono">4:34:59</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Clock,
    title: 'Precision Time Tracking',
    desc: 'One-click timer with keyboard shortcuts. Track by project and client. Manual entries when you forget to start.',
  },
  {
    icon: Users,
    title: 'Team Visibility',
    desc: 'See your whole team\'s time in one place. Managers approve time periods before billing. Full audit trail.',
  },
  {
    icon: FileText,
    title: 'One-Click Invoicing',
    desc: 'Approve a billing period and publish invoices directly to QuickBooks or Xero — with PDF reports attached.',
  },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Solo practitioners getting started',
    features: ['1 user', '3 projects', 'Unlimited time entries', 'Basic reports', 'CSV export'],
    cta: 'Get started free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/mo',
    desc: 'Individual accountants billing clients',
    features: [
      '1 user',
      'Unlimited projects',
      'QuickBooks Online sync',
      'Xero sync',
      'PDF reports',
      'Client management',
    ],
    cta: 'Start free trial',
    href: '/auth/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/mo',
    desc: 'Small accounting firms',
    features: [
      'Up to 15 users',
      'All Pro features',
      'Approval workflows',
      'Role-based access',
      'Priority support',
      'Usage analytics',
    ],
    cta: 'Start free trial',
    href: '/auth/signup?plan=team',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'How does the QuickBooks integration work?',
    a: 'Connect your QBO account via OAuth. When you approve a billing period in ORA, we create a draft invoice in QuickBooks with line items per project, hours, and rates — plus attach the PDF time report.',
  },
  {
    q: 'Can I use ORA without QuickBooks or Xero?',
    a: 'Yes. The Free and core Pro features work standalone. QBO/Xero sync is optional and only required if you want automatic invoice creation.',
  },
  {
    q: 'How is the timer stored?',
    a: 'Timer state is stored in our database the moment you hit Start. If you close the browser or switch devices, your timer keeps running and you\'ll see it when you return.',
  },
  {
    q: 'What happens when I approve a billing period?',
    a: 'ORA locks all time entries in the period, generates a PDF report, and enables the "Publish to QuickBooks" / "Publish to Xero" buttons. This creates invoices in your accounting system automatically.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-800 sticky top-0 z-50 bg-slate-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <OraLogo />
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-3 py-1 text-xs text-indigo-300 mb-6">
            <Zap className="w-3 h-3" />
            Now with QuickBooks & Xero integration
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-6">
            Your time.<br />
            Your clients.<br />
            <span className="text-indigo-400">Done.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            ORA is the time tracking platform built for accounting teams. Track hours, approve billing periods, and publish invoices to QuickBooks or Xero — in one click.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-4">No credit card required · Free plan available</p>
        </div>
        <div>
          <AnimatedTimer />
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          <span className="font-semibold text-slate-400">Trusted by accounting teams at:</span>
          {['Deloitte Alumni', 'Solo CPA Firms', 'Bookkeeping Agencies', 'Tax Advisors'].map((name) => (
            <span key={name} className="font-medium">{name}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">Everything you need to bill clients faster</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            ORA replaces spreadsheets, manual invoice creation, and disconnected time tracking tools.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-indigo-950 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Integration logos */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 mb-6">Publishes invoices directly to</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-xs font-black text-white">QB</div>
              QuickBooks Online
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center text-xs font-black text-white">X</div>
              Xero
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <div className="w-8 h-8 bg-violet-600 rounded flex items-center justify-center text-xs font-black text-white">S</div>
              Stripe
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 border-y border-slate-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">From hours tracked to invoice sent</h2>
            <p className="text-slate-400">The whole billing workflow in four steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Track time', desc: 'Start a timer or add entries manually. Assign to projects and clients.' },
              { step: '02', title: 'Close a period', desc: 'Select a date range and create a billing period. ORA assigns all entries automatically.' },
              { step: '03', title: 'Approve', desc: 'Admin reviews the period, approves hours, and ORA generates a PDF time report.' },
              { step: '04', title: 'Publish invoice', desc: 'One click sends a draft invoice to QuickBooks or Xero with the PDF attached.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-4xl font-black text-indigo-900 mb-3">{item.step}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400">Start free. Upgrade when you need integrations or team features.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="mb-4">
                <div className="font-bold text-lg mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.desc}</p>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-emerald-400'}`} />
                    <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-300'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center font-semibold py-2.5 rounded-lg transition-colors text-sm ${
                  plan.highlight
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-black mb-12 text-center">Frequently asked questions</h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-slate-800 pb-6">
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Start tracking time today</h2>
          <p className="text-indigo-200 mb-8">Free forever for solo users. No credit card required.</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Create free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <OraLogo size={28} />
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
          <p className="text-sm text-slate-600">© 2025 ORA. Time, tracked.</p>
        </div>
      </footer>
    </div>
  );
}
