'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// ─── types ───────────────────────────────────────────────────────────────────

type PeriodStatus = 'OPEN' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED';

interface TimeEntryLite {
  durationSeconds: number | null;
  isBillable: boolean;
  project: { hourlyRate: string } | null;
}

interface Period {
  id: string;
  periodType: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  _count: { entries: number };
  entries: TimeEntryLite[];
}

interface FormState {
  startDate: string;
  endDate: string;
  type: string;
}

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PeriodStatus, string> = {
  OPEN: 'bg-slate-700 text-slate-200',
  PENDING_APPROVAL: 'bg-amber-900 text-amber-200',
  APPROVED: 'bg-blue-900 text-blue-200',
  PUBLISHED: 'bg-emerald-900 text-emerald-200',
};

const STATUS_LABELS: Record<PeriodStatus, string> = {
  OPEN: 'Open',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
};

const DEFAULT_FORM: FormState = {
  startDate: '',
  endDate: '',
  type: 'MONTHLY',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function sumSeconds(entries: TimeEntryLite[] | undefined): number {
  return (entries ?? []).reduce((acc, e) => acc + (e.durationSeconds ?? 0), 0);
}

function formatHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function calcBillableAmount(entries: TimeEntryLite[] | undefined): number {
  return (entries ?? [])
    .filter((e) => e.isBillable && e.project?.hourlyRate)
    .reduce(
      (acc, e) =>
        acc + ((e.durationSeconds ?? 0) / 3600) * parseFloat(e.project!.hourlyRate),
      0
    );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // ── fetching ────────────────────────────────────────────────────────────

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/periods');
      if (res.ok) setPeriods(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // ── create ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType: form.type,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
        }),
      });
      if (res.ok) {
        await fetchPeriods();
        setShowDialog(false);
        setForm(DEFAULT_FORM);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-white">Reports &amp; Periods</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage billing periods and submit for approval
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Period
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-900 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900 border border-slate-800 rounded-xl">
          No billing periods yet. Create your first period to start the approval workflow.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                {['Date Range', 'Type', 'Status', 'Total Hours', 'Billable Amount', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const totalSeconds = sumSeconds(p.entries);
                const billable = calcBillableAmount(p.entries);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-white">
                      {format(new Date(p.startDate), 'MMM d')} –{' '}
                      {format(new Date(p.endDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {p.periodType.charAt(0) + p.periodType.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded ${
                          STATUS_STYLES[p.status]
                        }`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">
                      {formatHM(totalSeconds)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      ${billable.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/periods/${p.id}`}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dialog ─────────────────────────────────────────────────────── */}
      {showDialog && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDialog(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-normal text-white">Create Billing Period</h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Period type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Start date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  End date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.startDate || !form.endDate || saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Creating…' : 'Create Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
