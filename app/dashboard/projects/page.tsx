'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Archive, Pencil, X } from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  hourlyRate: number | string;
  isBillable: boolean;
  isArchived: boolean;
  client: Client | null;
}

interface FormState {
  name: string;
  clientId: string;
  color: string;
  hourlyRate: string;
  isBillable: boolean;
}

// ─── constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  '#3730A3',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#64748B',
];

const DEFAULT_FORM: FormState = {
  name: '',
  clientId: '',
  color: '#3730A3',
  hourlyRate: '0',
  isBillable: true,
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // ── fetching ────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (res.ok) setProjects(await res.json());
  }, []);

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/clients');
    if (res.ok) setClients(await res.json());
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [fetchProjects, fetchClients]);

  // ── dialog helpers ───────────────────────────────────────────────────────

  const openNew = () => {
    setEditProject(null);
    setForm(DEFAULT_FORM);
    setShowDialog(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({
      name: p.name,
      clientId: p.client?.id ?? '',
      color: p.color,
      hourlyRate: String(Number(p.hourlyRate).toFixed(2)),
      isBillable: p.isBillable,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditProject(null);
  };

  // ── submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        color: form.color,
        clientId: form.clientId || undefined,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        isBillable: form.isBillable,
      };

      if (editProject) {
        const res = await fetch(`/api/projects/${editProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated: Project = await res.json();
          setProjects((prev) => prev.map((p) => (p.id === editProject.id ? updated : p)));
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created: Project = await res.json();
          setProjects((prev) => [created, ...prev]);
        }
      }
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  // ── archive ──────────────────────────────────────────────────────────────

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this project? It will no longer appear in the timer.')) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: true }),
    });
    if (res.ok) {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isArchived: true } : p)));
    }
  };

  // ── computed ──────────────────────────────────────────────────────────────

  const visibleProjects = projects.filter((p) => showArchived || !p.isArchived);
  const activeCount = projects.filter((p) => !p.isArchived).length;
  const archivedCount = projects.filter((p) => p.isArchived).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {activeCount} active{archivedCount > 0 ? `, ${archivedCount} archived` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Project grid */}
      {visibleProjects.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900 border border-slate-800 rounded-xl">
          No projects yet. Create your first project to start tracking time.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map((p) => (
            <div
              key={p.id}
              className={`bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-opacity ${
                p.isArchived ? 'opacity-50' : ''
              }`}
              style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-white text-sm leading-tight truncate">
                  {p.name}
                </h3>
                {!p.isArchived && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded"
                      title="Edit project"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(p.id)}
                      className="p-1.5 text-slate-600 hover:text-amber-400 transition-colors rounded"
                      title="Archive project"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="space-y-1.5">
                {p.client && (
                  <p className="text-xs text-slate-500 truncate">{p.client.name}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">
                    ${Number(p.hourlyRate).toFixed(2)}/hr
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.isBillable
                        ? 'bg-emerald-900/60 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p.isBillable ? 'Billable' : 'Non-billable'}
                  </span>
                  {p.isArchived && (
                    <span className="text-xs bg-amber-900/40 text-amber-600 px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
                {editProject ? 'Edit Project' : 'New Project'}
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
                  Project name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Website Redesign"
                  autoFocus
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Client</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${
                        form.color === color
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Hourly rate */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Hourly rate (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Billable toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isBillable}
                    onChange={(e) => setForm((f) => ({ ...f, isBillable: e.target.checked }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      form.isBillable ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      form.isBillable ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-300">Billable project</span>
              </label>
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
                {saving ? 'Saving…' : editProject ? 'Save changes' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
