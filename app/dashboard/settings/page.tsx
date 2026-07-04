'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { SiQuickbooks, SiXero } from 'react-icons/si';

type Tab = 'profile' | 'organization' | 'billing' | 'integrations';

interface IntegrationStatus {
  connectedQBO: boolean;
  connectedXero: boolean;
  xeroOrgName: string | null;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'integrations' ? 'integrations' : 'profile'
  );
  const [integrations, setIntegrations] = useState<IntegrationStatus>({ connectedQBO: false, connectedXero: false, xeroOrgName: null });
  const [qboMsg, setQboMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [xeroMsg, setXeroMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    fetch('/api/integrations/qbo/status')
      .then((r) => r.json())
      .then((d) => setIntegrations((prev) => ({ ...prev, connectedQBO: !!d.connected })))
      .catch(() => {});
    fetch('/api/integrations/xero/status')
      .then((r) => r.json())
      .then((d) => setIntegrations((prev) => ({ ...prev, connectedXero: !!d.connected, xeroOrgName: d.orgName ?? null })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qbo = searchParams.get('qbo');
    if (qbo === 'connected') setQboMsg({ ok: true, text: 'QuickBooks connected successfully!' });
    if (qbo === 'error') setQboMsg({ ok: false, text: 'QuickBooks connection failed. Please try again.' });
    const xero = searchParams.get('xero');
    if (xero === 'connected') setXeroMsg({ ok: true, text: 'Xero connected successfully!' });
    if (xero === 'error') {
      const msg = searchParams.get('msg');
      setXeroMsg({ ok: false, text: msg ? `Xero connection failed: ${msg}` : 'Xero connection failed. Please try again.' });
    }
  }, [searchParams]);

  const handleSaveName = async () => {
    setSaving(true);
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
      <h1 className="text-2xl font-black mb-8" style={{ color: 'var(--text)' }}>Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 mb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Personal information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  readOnly
                  value={session?.user?.email || ''}
                  className="w-full rounded-lg px-3 py-2.5 text-sm cursor-not-allowed opacity-60"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Email cannot be changed</p>
              </div>
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {saved ? 'Saved' : saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Change password</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Leave blank to keep your current password</p>
            <div className="space-y-4">
              <input type="password" placeholder="Current password" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
              <input type="password" placeholder="New password (min 8 chars)" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
              <button className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--accent)' }}>Update password</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'organization' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Organization settings</h2>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Organization name</label>
            <input className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Default billing period</label>
            <select className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <button className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--accent)' }}>Save</button>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Current plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>Free</div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>1 user · 3 projects · no integrations</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>Current plan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '2px solid var(--accent)' }}>
              <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>Pro</div>
              <div className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>$12<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/mo</span></div>
              <ul className="text-xs space-y-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Unlimited projects</li>
                <li>QuickBooks & Xero</li>
                <li>PDF reports</li>
              </ul>
              <button className="w-full text-white text-sm font-semibold py-2 rounded-lg" style={{ background: 'var(--accent)' }}>Upgrade</button>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>Team</div>
              <div className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>$49<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/mo</span></div>
              <ul className="text-xs space-y-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Up to 15 users</li>
                <li>All Pro features</li>
                <li>Approval workflow</li>
              </ul>
              <button className="w-full text-white text-sm font-semibold py-2 rounded-lg" style={{ background: 'var(--accent)' }}>Upgrade</button>
            </div>
          </div>

          <button
            onClick={openBillingPortal}
            className="text-sm underline transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Open Stripe billing portal
          </button>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-4">
          {qboMsg && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{
              background: qboMsg.ok ? 'var(--success-bg)' : 'var(--error-bg)',
              color: qboMsg.ok ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${qboMsg.ok ? 'var(--success-border)' : 'var(--error-border)'}`,
            }}>
              {qboMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {qboMsg.text}
            </div>
          )}

          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center"><SiQuickbooks size={24} className="text-white" /></div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>QuickBooks Online</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {integrations.connectedQBO ? 'Connected — invoices will be published to your QBO account' : 'Publish invoices directly to QuickBooks'}
                  </div>
                </div>
              </div>
              {integrations.connectedQBO ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <a
                  href="/api/integrations/qbo/connect"
                  className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Connect
                </a>
              )}
            </div>
            {!integrations.connectedQBO && (
              <div className="mt-3 text-xs rounded px-3 py-2" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                Set INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET in your environment to enable.
              </div>
            )}
          </div>

          {xeroMsg && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{
              background: xeroMsg.ok ? 'var(--success-bg)' : 'var(--error-bg)',
              color: xeroMsg.ok ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${xeroMsg.ok ? 'var(--success-border)' : 'var(--error-border)'}`,
            }}>
              {xeroMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {xeroMsg.text}
            </div>
          )}

          <div className="rounded-xl p-6 relative" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center"><SiXero size={24} className="text-white" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>Xero</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {integrations.connectedXero
                      ? `Connected${integrations.xeroOrgName ? ` to ${integrations.xeroOrgName}` : ''} — invoices will be published to your Xero organisation`
                      : 'Publish invoices directly to Xero'}
                  </div>
                </div>
              </div>
              {integrations.connectedXero ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>
                    <CheckCircle className="w-4 h-4" /> Connected
                  </span>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/integrations/xero/disconnect', { method: 'POST' });
                      if (res.ok) setIntegrations((prev) => ({ ...prev, connectedXero: false }));
                    }}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <button
                    disabled
                    className="text-white text-sm font-semibold px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
                    style={{ background: 'var(--accent)' }}
                  >
                    Connect
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                    <div className="text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      Xero integration coming soon
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
