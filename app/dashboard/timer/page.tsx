'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Play, Square, DollarSign, Trash2 } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';

// ─── types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  color: string;
  hourlyRate: number;
  isBillable: boolean;
}

interface TimeEntry {
  id: string;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isBillable: boolean;
  project: { id: string; name: string; color: string } | null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatHM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [entryId, setEntryId] = useState<string | null>(null);

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // ── data fetching ─────────────────────────────────────────────────────────

  const fetchTodayEntries = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const res = await fetch(`/api/time-entries?startDate=${today.toISOString()}`);
    if (res.ok) {
      const data: TimeEntry[] = await res.json();
      setTodayEntries(data.filter((e) => e.stoppedAt !== null));
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (res.ok) setProjects(await res.json());
  }, []);

  const checkActiveTimer = useCallback(async () => {
    const res = await fetch('/api/time-entries?active=true');
    if (!res.ok) return;
    const data = await res.json();
    const active: TimeEntry | null = Array.isArray(data) ? data[0] ?? null : data ?? null;
    if (active && !active.stoppedAt) {
      const start = new Date(active.startedAt);
      setEntryId(active.id);
      setStartedAt(start);
      setIsRunning(true);
      setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
      setDescription(active.description ?? '');
      setProjectId(active.project?.id ?? '');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTodayEntries();
    checkActiveTimer();
  }, [fetchProjects, fetchTodayEntries, checkActiveTimer]);

  // ── timer tick ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startedAt]);

  // ── space bar toggle ──────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (loading || isRunning) return;
    setLoading(true);
    try {
      const now = new Date();
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startedAt: now.toISOString(),
          description: description || undefined,
          projectId: projectId || undefined,
          isBillable,
        }),
      });
      if (!res.ok) return;
      const entry: TimeEntry = await res.json();
      setEntryId(entry.id);
      setStartedAt(now);
      setIsRunning(true);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  }, [loading, isRunning, description, projectId, isBillable]);

  const handleStop = useCallback(async () => {
    if (!entryId || loading || !isRunning) return;
    setLoading(true);
    try {
      const now = new Date();
      await fetch(`/api/time-entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stoppedAt: now.toISOString() }),
      });
      setIsRunning(false);
      setStartedAt(null);
      setEntryId(null);
      setElapsed(0);
      setDescription('');
      setProjectId('');
      await fetchTodayEntries();
    } finally {
      setLoading(false);
    }
  }, [entryId, loading, isRunning, fetchTodayEntries]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        if (isRunning) {
          handleStop();
        } else {
          handleStart();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isRunning, handleStart, handleStop]);

  // ── delete entry ─────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;
    await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    setTodayEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── computed ──────────────────────────────────────────────────────────────

  const todayTotal = todayEntries.reduce((acc, e) => acc + (e.durationSeconds ?? 0), 0);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-white">Timer</h1>

      {/* ── Timer card ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {/* Giant clock display */}
        <div className="text-center mb-8">
          <span
            className={`text-7xl md:text-9xl font-mono font-black tabular-nums tracking-tight select-none ${
              isRunning ? 'text-emerald-400' : 'text-slate-600'
            }`}
          >
            {formatElapsed(elapsed)}
          </span>
          {!isRunning && (
            <p className="text-slate-500 text-sm mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono text-xs">Space</kbd> or click Start
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Description */}
          <input
            ref={descriptionRef}
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 text-sm"
          />

          {/* Project + billable */}
          <div className="flex gap-3 items-center">
            <ProjectCombobox
              projects={projects}
              value={projectId || null}
              onChange={(id) => setProjectId(id ?? '')}
              disabled={isRunning}
              placeholder="No project"
            />

            <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                disabled={isRunning}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Billable
              </span>
            </label>
          </div>

          {/* Project color preview */}
          {selectedProject && (
            <div className="flex items-center gap-2 px-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedProject.color }}
              />
              <span className="text-xs text-slate-500">{selectedProject.name}</span>
            </div>
          )}

          {/* Start / Stop button */}
          <OriginButton
            onClick={isRunning ? handleStop : handleStart}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-colors disabled:opacity-50 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-5 h-5" />
                Stop Timer
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Timer
              </>
            )}
          </OriginButton>
        </div>
      </div>

      {/* ── Today's entries ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Today
          </h2>
          <span className="text-sm font-mono text-slate-400 tabular-nums">
            {formatHM(todayTotal)}
          </span>
        </div>

        {todayEntries.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-10 bg-slate-900 border border-slate-800 rounded-xl">
            No entries logged today yet.
          </div>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => {
              const seconds = entry.durationSeconds ?? 0;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 group hover:border-slate-700 transition-colors"
                >
                  {/* Project dot */}
                  {entry.project ? (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.project.color }}
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-600" />
                  )}

                  {/* Description + project name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">
                      {entry.description ? (
                        entry.description
                      ) : (
                        <span className="text-slate-500 italic">No description</span>
                      )}
                    </p>
                    {entry.project && (
                      <p className="text-xs text-slate-500">{entry.project.name}</p>
                    )}
                  </div>

                  {/* Time range */}
                  <span className="text-xs text-slate-500 hidden sm:block flex-shrink-0">
                    {format(new Date(entry.startedAt), 'HH:mm')}
                    {entry.stoppedAt
                      ? ` – ${format(new Date(entry.stoppedAt), 'HH:mm')}`
                      : ''}
                  </span>

                  {/* Duration */}
                  <span className="text-sm font-mono text-slate-300 tabular-nums flex-shrink-0">
                    {formatHM(seconds)}
                  </span>

                  {/* Billable */}
                  {entry.isBillable && (
                    <span className="text-xs text-emerald-500 flex-shrink-0">$</span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
