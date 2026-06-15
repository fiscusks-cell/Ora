'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Circle } from 'lucide-react';
import { CURRENCIES } from '@/lib/utils';

// ─── types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email: string | null;
  currency: string;
  qboCustomerId: string | null;
  xeroContactId: string | null;
  _count?: { projects: number };
}

interface FormState {
  name: string;
  email: string;
  currency: string;
}

// ─── constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  name: '',
  email: '',
  currency: 'USD',
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // ── fetching ────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) setClients(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── dialog helpers ───────────────────────────────────────────────────────

  const openNew = () => {
    setEditClient(null);
    setForm(DEFAULT_FORM);
    setShowDialog(true);
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, email: c.email ?? '', currency: c.currency });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditClient(null);
  };

  // ── submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        currency: form.currency,
      };

      if (editClient) {
        const res = await fetch(`/api/clients/${editClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated: Client = await res.json();
          setClients((prev) =>
            prev.map((c) => (c.id === editClient.id ? { ...c, ...updated } : c))
          );
        }
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchClients();
        }
      }
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Clients</h1>
          <p className="text-sm text-slate-400 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Client
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-900 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900 border border-slate-800 rounded-xl">
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  QBO
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Xero
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{c.currency}</td>

                  {/* QBO status */}
                  <td className="px-4 py-3 text-center">
                    <Circle
                      className={`w-3.5 h-3.5 inline-block ${
                        c.qboCustomerId
                          ? 'fill-emerald-500 text-emerald-500'
                          : 'fill-slate-700 text-slate-700'
                      }`}
                    />
                  </td>

                  {/* Xero status */}
                  <td className="px-4 py-3 text-center">
                    <Circle
                      className={`w-3.5 h-3.5 inline-block ${
                        c.xeroContactId
                          ? 'fill-emerald-500 text-emerald-500'
                          : 'fill-slate-700 text-slate-700'
                      }`}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded"
                        title="Edit client"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded"
                        title="Delete client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dialog ─────────────────────────────────────────────────────── */}
      {showDialog && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Dialog header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editClient ? 'Edit Client' : 'New Client'}
              </h2>
              <button
                onClick={closeDialog}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Acme Corp"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="billing@example.com (optional)"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeDialog}
                className="flex-1 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {saving ? 'Saving…' : editClient ? 'Save changes' : 'Create client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
