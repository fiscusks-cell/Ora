'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Tab = 'profile' | 'organization' | 'billing' | 'integrations';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [tab, setTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const handleSaveName = async () => {
    setSaving(true);
    // Profile update would call a settings API route
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const openBillingPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.open(data.url, '_blank');
    else alert(data.error || 'Billing portal unavailable');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'organization', label: 'Organization' },
    { id: 'billing', label: 'Billing' },
    { id: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-8">Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-slate-800 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Personal information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Display name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  readOnly
                  value={session?.user?.email || ''}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
              </div>
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-2">Change password</h2>
            <p className="text-sm text-slate-400 mb-4">Leave blank to keep your current password</p>
            <div className="space-y-4">
              <input type="password" placeholder="Current password" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" placeholder="New password (min 8 chars)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Update password</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'organization' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white mb-4">Organization settings</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Organization name</label>
            <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Default billing period</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Save</button>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-2">Current plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">Free</div>
                <p className="text-sm text-slate-400 mt-1">1 user · 3 projects · no integrations</p>
              </div>
              <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full font-semibold">Current plan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-indigo-800 rounded-xl p-5">
              <div className="font-bold text-white mb-1">Pro</div>
              <div className="text-2xl font-black text-white mb-2">$12<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-1 mb-4">
                <li>✓ Unlimited projects</li>
                <li>✓ QuickBooks & Xero</li>
                <li>✓ PDF reports</li>
              </ul>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-lg">Upgrade</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="font-bold text-white mb-1">Team</div>
              <div className="text-2xl font-black text-white mb-2">$49<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-1 mb-4">
                <li>✓ Up to 15 users</li>
                <li>✓ All Pro features</li>
                <li>✓ Approval workflow</li>
              </ul>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-lg">Upgrade</button>
            </div>
          </div>

          <button
            onClick={openBillingPortal}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Open Stripe billing portal →
          </button>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center font-black text-white text-sm">QB</div>
                <div>
                  <div className="font-semibold text-white">QuickBooks Online</div>
                  <div className="text-sm text-slate-400">Publish invoices directly to QuickBooks</div>
                </div>
              </div>
              <button className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Connect
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-800 rounded px-3 py-2">
              Set INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET in your environment to enable.
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center font-black text-white text-sm">X</div>
                <div>
                  <div className="font-semibold text-white">Xero</div>
                  <div className="text-sm text-slate-400">Publish invoices directly to Xero</div>
                </div>
              </div>
              <button className="bg-sky-700 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Connect
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-800 rounded px-3 py-2">
              Set XERO_CLIENT_ID and XERO_CLIENT_SECRET in your environment to enable.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
