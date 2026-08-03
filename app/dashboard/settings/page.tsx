'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { SiQuickbooks, SiXero } from 'react-icons/si';
import { PLANS, type PlanKey } from '@/lib/plans';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Tab = 'profile' | 'organization' | 'billing' | 'integrations';

interface IntegrationStatus {
  connectedQBO: boolean;
  connectedXero: boolean;
  xeroOrgName: string | null;
}

interface OrgInfo {
  name: string;
  plan: PlanKey;
  billingPeriod: string;
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
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [weekStartDay, setWeekStartDay] = useState(1);
  const [weekStartSaving, setWeekStartSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    fetch('/api/org')
      .then((r) => r.json())
      .then((d) => setOrg(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/user/avatar')
      .then((r) => r.json())
      .then((d) => setAvatarUrl(d.url ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/user/preferences')
      .then((r) => r.json())
      .then((d) => { if (typeof d.weekStartDay === 'number') setWeekStartDay(d.weekStartDay); })
      .catch(() => {});
  }, []);

  const handleWeekStartChange = async (value: number) => {
    setWeekStartDay(value);
    setWeekStartSaving(true);
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDay: value }),
      });
    } finally {
      setWeekStartSaving(false);
    }
  };

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2 MB.');
      return;
    }
    setAvatarError('');
    setPendingFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setAvatarError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAvatar = async () => {
    if (!pendingFile) return;
    setAvatarSaving(true);
    setAvatarError('');
    try {
      const fd = new FormData();
      fd.append('avatar', pendingFile);
      const res = await fetch('/api/user/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setAvatarError(data.error ?? 'Upload failed'); return; }
      setAvatarUrl(data.url);
      setPendingFile(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSaving(true);
    setAvatarError('');
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' });
      if (res.ok) { setAvatarUrl(null); }
      else { const d = await res.json(); setAvatarError(d.error ?? 'Remove failed'); }
    } finally {
      setAvatarSaving(false);
    }
  };

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
    <div className="p-8">
      <h1 className="text-2xl font-normal text-white mb-8">Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-slate-800 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Profile photo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-normal text-white mb-4">Profile photo</h2>
            <div className="flex items-center gap-5">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage
                  src={previewUrl ?? avatarUrl ?? undefined}
                  alt={session?.user?.name ?? ''}
                />
                <AvatarFallback
                  className="text-xl text-white"
                  style={{ background: 'var(--sidebar-active)' }}
                >
                  {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarSaving}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {pendingFile ? 'Change' : 'Upload photo'}
                  </button>
                  {pendingFile && (
                    <>
                      <button
                        onClick={handleSaveAvatar}
                        disabled={avatarSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {avatarSaving ? 'Saving…' : 'Save photo'}
                      </button>
                      <button
                        onClick={handleCancelPending}
                        disabled={avatarSaving}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Discard
                      </button>
                    </>
                  )}
                  {avatarUrl && !pendingFile && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarSaving}
                      className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                    >
                      {avatarSaving ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">JPEG, PNG, or WebP · max 2 MB</p>
                {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-normal text-white mb-4">Personal information</h2>
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
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-normal text-white mb-4">Time preferences</h2>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Week starts on</label>
              <select
                value={weekStartDay}
                onChange={(e) => handleWeekStartChange(Number(e.target.value))}
                disabled={weekStartSaving}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-normal text-white mb-2">Change password</h2>
            <p className="text-sm text-slate-400 mb-4">Leave blank to keep your current password</p>
            <div className="space-y-4">
              <input type="password" placeholder="Current password" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" placeholder="New password (min 8 chars)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">Update password</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'organization' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-normal text-white mb-4">Organization settings</h2>
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
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">Save</button>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-normal text-white mb-2">Current plan</h2>
            {org ? (() => {
              const currentPlan = PLANS[org.plan] ?? PLANS.FREE;
              const seatsText = currentPlan.seats === null ? 'Unlimited users' : `${currentPlan.seats} user${currentPlan.seats === 1 ? '' : 's'}`;
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl text-white">{currentPlan.name}</div>
                    <p className="text-sm text-slate-400 mt-1">
                      {seatsText} · {org.billingPeriod.toLowerCase()} billing
                    </p>
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full">Current plan</span>
                </div>
              );
            })() : (
              <div className="h-12 bg-slate-800 rounded-lg animate-pulse" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-indigo-800 rounded-xl p-5">
              <div className="text-white mb-1">{PLANS.PRO.name}</div>
              <div className="text-2xl text-white mb-2">${PLANS.PRO.monthlyPrice}<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-1 mb-4">
                {PLANS.PRO.features.slice(0, 3).map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg">Upgrade</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-white mb-1">{PLANS.TEAM.name}</div>
              <div className="text-2xl text-white mb-2">${PLANS.TEAM.monthlyPrice}<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-1 mb-4">
                {PLANS.TEAM.features.slice(0, 3).map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg">Upgrade</button>
            </div>
          </div>

          <button
            onClick={openBillingPortal}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Open billing portal →
          </button>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-4">
          {qboMsg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
              qboMsg.ok
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-red-950 text-red-300 border-red-800'
            }`}>
              {qboMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {qboMsg.text}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center"><SiQuickbooks size={22} className="text-white" /></div>
                <div>
                  <div className="text-white">QuickBooks Online</div>
                  <div className="text-sm text-slate-400">
                    {integrations.connectedQBO ? 'Connected — invoices will be published to your QBO account' : 'Publish invoices directly to QuickBooks'}
                  </div>
                </div>
              </div>
              {integrations.connectedQBO ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <a
                  href="/api/integrations/qbo/connect"
                  className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Connect
                </a>
              )}
            </div>
            {!integrations.connectedQBO && (
              <div className="mt-3 text-xs text-slate-600 bg-slate-800 rounded px-3 py-2">
                Set INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET in your environment to enable.
              </div>
            )}
          </div>

          {xeroMsg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
              xeroMsg.ok
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-red-950 text-red-300 border-red-800'
            }`}>
              {xeroMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {xeroMsg.text}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center"><SiXero size={22} className="text-white" /></div>
                <div>
                  <div className="text-white">Xero</div>
                  <div className="text-sm text-slate-400">
                    {integrations.connectedXero
                      ? `Connected${integrations.xeroOrgName ? ` to ${integrations.xeroOrgName}` : ''} — invoices will be published to your Xero organisation`
                      : 'Publish invoices directly to Xero'}
                  </div>
                </div>
              </div>
              {integrations.connectedXero ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" /> Connected
                  </span>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/integrations/xero/disconnect', { method: 'POST' });
                      if (res.ok) setIntegrations((prev) => ({ ...prev, connectedXero: false }));
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <a
                  href="/api/integrations/xero/connect"
                  className="bg-sky-700 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Connect
                </a>
              )}
            </div>
            {!integrations.connectedXero && (
              <div className="mt-3 text-xs text-slate-600 bg-slate-800 rounded px-3 py-2">
                Set XERO_CLIENT_ID and XERO_CLIENT_SECRET in your environment to enable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
