'use client';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { format } from 'date-fns';

interface Entry {
  id: string;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isBillable: boolean;
  project: { id: string; name: string; color: string; client?: { name: string } | null } | null;
  user: { name: string };
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/time-entries');
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEdit = (e: Entry) => {
    setEditId(e.id);
    setEditDesc(e.description || '');
  };

  const handleSave = async (id: string) => {
    await fetch(`/api/time-entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc }),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, description: editDesc } : e)));
    setEditId(null);
  };

  // Group by date
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries.filter((e) => e.stoppedAt)) {
    const d = format(new Date(e.startedAt), 'yyyy-MM-dd');
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-8">Time Entries</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : Object.keys(byDate).length === 0 ? (
        <div className="text-center text-slate-500 py-16">No time entries yet. Start tracking from the Timer page.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + (e.durationSeconds || 0), 0);
            return (
              <div key={date} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/30">
                  <span className="text-sm font-semibold text-slate-200">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <span className="text-sm font-mono text-slate-300 tabular-nums">{formatDuration(dayTotal)}</span>
                </div>
                {dayEntries.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/50 last:border-0">
                    {e.project ? (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.project.color }} />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-700" />
                    )}

                    <div className="flex-1 min-w-0">
                      {editId === e.id ? (
                        <input
                          autoFocus
                          value={editDesc}
                          onChange={(ev) => setEditDesc(ev.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="text-sm text-slate-200 truncate">
                          {e.description || <span className="text-slate-500 italic">No description</span>}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">
                        {e.project?.name}
                        {e.project?.client && ` · ${e.project.client.name}`}
                        {e.isBillable && <span className="ml-2 text-emerald-600">billable</span>}
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 tabular-nums">
                      {format(new Date(e.startedAt), 'HH:mm')}–{e.stoppedAt ? format(new Date(e.stoppedAt), 'HH:mm') : '?'}
                    </span>

                    <span className="text-sm font-mono text-slate-300 tabular-nums w-20 text-right">
                      {formatDuration(e.durationSeconds || 0)}
                    </span>

                    <div className="flex items-center gap-1">
                      {editId === e.id ? (
                        <>
                          <button onClick={() => handleSave(e.id)} className="text-emerald-400 hover:text-emerald-300 p-1">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-300 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(e)} className="text-slate-600 hover:text-slate-400 p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="text-slate-600 hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
