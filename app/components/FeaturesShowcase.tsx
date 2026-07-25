'use client';

import { useState } from 'react';
import { Timer, Stamp, Send, FileText, Users } from 'lucide-react';

const features = [
  { id: 'timer', icon: Timer, label: 'Start the timer in one click', color: '#10B981' },
  { id: 'approve', icon: Stamp, label: 'Approve your billing period', color: '#818CF8' },
  { id: 'publish', icon: Send, label: 'Push to QuickBooks or Xero', color: '#CA8A04' },
  { id: 'pdf', icon: FileText, label: 'PDF report auto-attached', color: '#F97316' },
  { id: 'team', icon: Users, label: 'Track team hours', color: '#0EA5E9' },
];

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-400 max-w-xs">
            app.ora.io/dashboard
          </div>
        </div>
      </div>
      <div className="p-6 min-h-[340px]">{children}</div>
    </div>
  );
}

function TimerMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Currently tracking</p>
      <p className="text-sm font-semibold text-slate-700">Smith &amp; Co. — Tax Returns</p>
      <div className="text-6xl font-black text-emerald-500 tabular-nums tracking-tight">02:34:18</div>
      <button className="mt-2 px-8 py-3 bg-red-500 text-white font-bold rounded-xl text-sm">
        ■&nbsp; Stop Timer
      </button>
    </div>
  );
}

function ApproveMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-slate-800">Jun 1–14, 2025</p>
          <p className="text-xs text-slate-400">Billing Period</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">Approved</span>
      </div>
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr><th className="text-left px-3 py-2 font-medium">Client</th><th className="text-right px-3 py-2 font-medium">Hours</th><th className="text-right px-3 py-2 font-medium">Amount</th></tr>
          </thead>
          <tbody className="text-slate-700">
            <tr className="border-t border-slate-100"><td className="px-3 py-2.5">Smith &amp; Co.</td><td className="text-right px-3 py-2.5">24.5</td><td className="text-right px-3 py-2.5">$6,125.00</td></tr>
            <tr className="border-t border-slate-100"><td className="px-3 py-2.5">Acme Corp</td><td className="text-right px-3 py-2.5">18.0</td><td className="text-right px-3 py-2.5">$3,600.00</td></tr>
            <tr className="border-t border-slate-100 bg-slate-50 font-semibold"><td className="px-3 py-2.5">Total</td><td className="text-right px-3 py-2.5">42.5</td><td className="text-right px-3 py-2.5">$9,725.00</td></tr>
          </tbody>
        </table>
      </div>
      <button className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg text-sm">
        Publish to QuickBooks →
      </button>
    </div>
  );
}

function PublishMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <p className="text-lg font-bold text-slate-800">Invoice #146 created in QuickBooks</p>
      <p className="text-sm text-slate-500">PDF time report attached · 42.5 hours · $9,725.00</p>
      <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-black" style={{ background: '#2CA01C' }}>QB</div>
        <span className="text-sm text-slate-600">Synced to QuickBooks Online</span>
      </div>
    </div>
  );
}

function PdfMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-yellow-400" />
        <span className="text-sm font-black text-slate-800 tracking-tight">ORA</span>
        <span className="ml-auto text-xs text-slate-400">Time Report — Jun 2025</span>
      </div>
      <div className="border border-slate-100 rounded-lg overflow-hidden text-sm">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr><th className="text-left px-3 py-2 font-medium">Date</th><th className="text-left px-3 py-2 font-medium">Project</th><th className="text-right px-3 py-2 font-medium">Hours</th><th className="text-right px-3 py-2 font-medium">Amount</th></tr>
          </thead>
          <tbody className="text-slate-700">
            <tr className="border-t border-slate-100"><td className="px-3 py-2">Jun 2</td><td className="px-3 py-2">Tax Returns</td><td className="text-right px-3 py-2">6.0</td><td className="text-right px-3 py-2">$1,500.00</td></tr>
            <tr className="border-t border-slate-100"><td className="px-3 py-2">Jun 3</td><td className="px-3 py-2">Bookkeeping</td><td className="text-right px-3 py-2">4.5</td><td className="text-right px-3 py-2">$900.00</td></tr>
            <tr className="border-t border-slate-100"><td className="px-3 py-2">Jun 5</td><td className="px-3 py-2">Tax Returns</td><td className="text-right px-3 py-2">7.0</td><td className="text-right px-3 py-2">$1,750.00</td></tr>
            <tr className="border-t border-slate-100"><td className="px-3 py-2">Jun 6</td><td className="px-3 py-2">Advisory</td><td className="text-right px-3 py-2">2.5</td><td className="text-right px-3 py-2">$662.50</td></tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-xl font-black text-slate-800">$4,812.50</p>
        </div>
      </div>
    </div>
  );
}

function TeamMockup() {
  const members = [
    { name: 'Sarah Kim', hours: 38, max: 40, color: '#10B981' },
    { name: 'James Park', hours: 42, max: 40, color: '#F97316' },
    { name: 'Maria Santos', hours: 31, max: 40, color: '#0EA5E9' },
    { name: 'Alex Chen', hours: 36, max: 40, color: '#818CF8' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-slate-800">Team Workload</p>
        <span className="text-xs text-slate-400">This week</span>
      </div>
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 font-medium">{m.name}</span>
              <span className="text-slate-500">{m.hours}h / {m.max}h</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min((m.hours / m.max) * 100, 100)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockups: Record<string, React.ReactNode> = {
  timer: <TimerMockup />,
  approve: <ApproveMockup />,
  publish: <PublishMockup />,
  pdf: <PdfMockup />,
  team: <TeamMockup />,
};

export default function FeaturesShowcase() {
  const [active, setActive] = useState('timer');

  return (
    <div className="flex flex-col md:flex-row gap-10 items-start">
      {/* Left: feature list */}
      <div className="w-full md:w-[38%] space-y-1.5">
        {features.map((f) => {
          const Icon = f.icon;
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-white shadow-sm border border-slate-200'
                  : 'hover:bg-white/60 border border-transparent'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? f.color + '18' : 'transparent' }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? f.color : '#94a3b8' }} />
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: app mockup */}
      <div className="w-full md:w-[62%]">
        <BrowserChrome>{mockups[active]}</BrowserChrome>
      </div>
    </div>
  );
}
