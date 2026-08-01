'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency: string;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDownload = async (inv: Invoice) => {
    const res = await fetch(`/api/invoices/${inv.id}/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8"><div className="h-32 skeleton rounded-xl" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-white">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">All generated invoice PDFs</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No invoices generated yet</p>
          <p className="text-slate-600 text-sm mt-1">Generate your first invoice from an approved billing period</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Invoice #', 'Client', 'Period', 'Amount', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map(inv => (
                <tr key={inv.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-sm text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{inv.clientName}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {inv.periodStart && inv.periodEnd
                      ? `${format(new Date(inv.periodStart), 'MMM d')} – ${format(new Date(inv.periodEnd), 'MMM d, yyyy')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{formatCurrency(inv.amount, inv.currency)}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{format(new Date(inv.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(inv)}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
