'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { getCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { CheckCircle, Clock, FileText, AlertCircle, Download } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

interface Entry {
  id: string;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isBillable: boolean;
  project: { id: string; name: string; color: string; hourlyRate: string; client: { name: string; currency: string } | null } | null;
  user: { id: string; name: string };
}

interface Period {
  id: string;
  periodType: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED';
  qboInvoiceId: string | null;
  xeroInvoiceId: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  entries: Entry[];
  stats?: { totalEntries: number; totalSeconds: number; totalBillableAmount: number };
  byProject?: Array<{
    projectId: string;
    projectName: string;
    projectColor: string;
    clientName: string | null;
    clientCurrency: string;
    totalSeconds: number;
    billableAmount: number;
  }>;
}

const STATUS_LABEL = {
  OPEN: { label: 'Open', color: 'text-slate-400 bg-slate-800' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-amber-400 bg-amber-900/50' },
  APPROVED: { label: 'Approved', color: 'text-blue-400 bg-blue-900/50' },
  PUBLISHED: { label: 'Published', color: 'text-emerald-400 bg-emerald-900/50' },
};

export default function PeriodDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'summary' | 'entries'>('summary');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/periods/${id}`);
    if (res.ok) setPeriod(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (url: string, method = 'PATCH') => {
    setActionLoading(true);
    setMessage('');
    const res = await fetch(url, { method });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || data.message || 'Action failed');
    else await load();
    setActionLoading(false);
  };

  const handleGenerateInvoice = async () => {
    setInvoiceLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/periods/${id}/generate-invoice`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to generate invoice');
        return;
      }
      const invNum = res.headers.get('X-Invoice-Number') || 'invoice';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invNum}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setInvoiceGenerated(invNum);
    } catch {
      setMessage('Failed to generate invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) return <div className="p-8"><div className="h-32 skeleton rounded-xl" /></div>;
  if (!period) return <div className="p-8 text-slate-400">Period not found</div>;

  const totalSeconds = period.stats?.totalSeconds ?? (period.entries ?? []).reduce((s, e) => s + (e.durationSeconds || 0), 0);
  const totalAmount = period.stats?.totalBillableAmount ?? 0;
  const s = STATUS_LABEL[period.status];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Billing Period</div>
            <h1 className="text-2xl font-black text-white">
              {format(new Date(period.startDate), 'MMM d')} – {format(new Date(period.endDate), 'MMM d, yyyy')}
            </h1>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
        </div>

        <div className="flex gap-6">
          <div>
            <div className="text-xs text-slate-500">Total Hours</div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">{formatDuration(totalSeconds)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Billable Amount</div>
            <div className="text-xl font-bold text-white">{formatCurrency(totalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Entries</div>
            <div className="text-xl font-bold text-white">{(period.entries ?? []).length}</div>
          </div>
        </div>
      </div>

      {period.status === 'PUBLISHED' && (
        <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-sm text-emerald-300">
            Published {period.publishedAt ? format(new Date(period.publishedAt), 'MMM d, yyyy') : ''}
            {period.qboInvoiceId && <span className="ml-3">· QBO: {period.qboInvoiceId}</span>}
            {period.xeroInvoiceId && <span className="ml-3">· Xero: {period.xeroInvoiceId}</span>}
          </div>
        </div>
      )}

      {message && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      <div className="flex gap-3 mb-8">
        {period.status === 'OPEN' && (
          <OriginButton
            onClick={() => doAction(`/api/periods/${id}/submit`)}
            disabled={actionLoading || (period.entries ?? []).length === 0}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" /> Submit for Approval
          </OriginButton>
        )}
        {period.status === 'PENDING_APPROVAL' && (
          <OriginButton
            onClick={() => doAction(`/api/periods/${id}/approve`)}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Approve Period
          </OriginButton>
        )}
        {period.status === 'APPROVED' && (
          <>
            <OriginButton
              onClick={() => doAction(`/api/periods/${id}/publish/qbo`, 'POST')}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" /> Publish to QuickBooks
            </OriginButton>
            <OriginButton
              onClick={() => doAction(`/api/periods/${id}/publish/xero`, 'POST')}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" /> Publish to Xero
            </OriginButton>
            <OriginButton
              onClick={handleGenerateInvoice}
              disabled={invoiceLoading}
              className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> {invoiceLoading ? 'Generating…' : 'Download Invoice PDF'}
            </OriginButton>
          </>
        )}
        {invoiceGenerated && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4" /> {invoiceGenerated} generated
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-800 mb-6">
        {(['summary', 'entries'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-3">
          {(period.byProject ?? []).map((p) => (
            <div key={p.projectId} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.projectColor }} />
                  <span className="font-semibold text-white">{p.projectName}</span>
                  {p.clientName && <span className="text-xs text-slate-500">· {p.clientName}</span>}
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <div className="text-xs text-slate-500">Hours</div>
                    <div className="text-sm font-mono text-slate-300">{formatDuration(p.totalSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="text-sm font-semibold text-white">{formatCurrency(p.billableAmount, p.clientCurrency)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <span className="font-bold text-white">Total</span>
            <div className="flex gap-6">
              <span className="font-mono text-white">{formatDuration(totalSeconds)}</span>
              <span className="font-bold text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'entries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {(period.entries ?? []).length === 0 ? (
            <div className="text-center text-slate-500 py-8">No entries in this period</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Date', 'Description', 'Project', 'User', 'Duration', 'Billable'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(period.entries ?? []).map(e => (
                  <tr key={e.id} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-3 text-sm text-slate-400">{format(new Date(e.startedAt), 'MMM d')}</td>
                    <td className="px-4 py-3 text-sm text-slate-200 max-w-xs truncate">{e.description || <span className="text-slate-500 italic">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {e.project ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.project.color }} />
                          {e.project.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{e.user.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300 tabular-nums">{formatDuration(e.durationSeconds || 0)}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.isBillable ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-600">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
