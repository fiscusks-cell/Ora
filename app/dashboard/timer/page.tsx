'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Play, Square, DollarSign, Trash2 } from 'lucide-react';
import { JetBrains_Mono } from 'next/font/google';
import { OriginButton } from '@/components/ui/origin-button';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'] });

// ─── types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  color: string;
  hourlyRate: number;
  isBillable: boolean;
  client: { id: string; name: string } | null;
}

interface RecentDesc {
  description: string;
  projectName: string;
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

  // Feature 3: recent descriptions dropdown
  const [recentDescs, setRecentDescs] = useState<RecentDesc[]>([]);
  const [showDescs, setShowDescs] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const descSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── start / stop ──────────────────────────────────────────────────────────

  // Feature 4: accepts optional overrides so Play button can pass entry values
  // without waiting for state to update asynchronously
  const handleStart = useCallback(async (opts?: {
    projectId?: string;
    description?: string;
    isBillable?: boolean;
  }) => {
    if (loading || isRunning) return;
    setLoading(true);
    try {
      const pid = opts?.projectId !== undefined ? opts.projectId : projectId;
      const desc = opts?.description !== undefined ? opts.description : description;
      const billable = opts?.isBillable !== undefined ? opts.isBillable : isBillable;
      const now = new Date();
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startedAt: now.toISOString(),
          description: desc || undefined,
          projectId: pid || undefined,
          isBillable: billable,
        }),
      });
      if (!res.ok) return;
      const entry: TimeEntry = await res.json();
      setEntryId(entry.id);
      setStartedAt(now);
      setIsRunning(true);
      setElapsed(0);
      if (opts?.projectId !== undefined) setProjectId(opts.projectId);
      if (opts?.description !== undefined) setDescription(opts.description);
      if (opts?.isBillable !== undefined) setIsBillable(opts.isBillable);
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

  // Feature 4: play an existing entry (restart with same project + description)
  const handlePlay = useCallback((entry: TimeEntry) => {
    handleStart({
      projectId: entry.project?.id ?? '',
      description: entry.description ?? '',
      isBillable: entry.isBillable,
    });
  }, [handleStart]);

  // ── space bar toggle ──────────────────────────────────────────────────────

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

  // Feature 2: save description to DB in real-time (debounced)
  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (isRunning && entryId) {
      if (descSaveTimer.current) clearTimeout(descSaveTimer.current);
      descSaveTimer.current = setTimeout(() => {
        fetch(`/api/time-entries/${entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: val || null }),
        });
      }, 800);
    }
  };

  // Feature 3: load recent descriptions for the selected project's client on focus
  const handleDescFocus = async () => {
    const clientId = selectedProject?.client?.id;
    if (!clientId) return;
    const res = await fetch(`/api/time-entries?clientId=${clientId}`);
    if (!res.ok) return;
    const entries: TimeEntry[] = await res.json();
    const seen = new Set<string>();
    const unique: RecentDesc[] = [];
    for (const e of entries) {
      if (e.description && !seen.has(e.description) && unique.length < 3) {
        seen.add(e.description);
        unique.push({ description: e.description, projectName: e.project?.name ?? '' });
      }
    }
    setRecentDescs(unique);
    if (unique.length > 0) setShowDescs(true);
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
            className={`${jetbrainsMono.className} text-7xl md:text-9xl tabular-nums tracking-tight select-none ${
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
          {/* Feature 2 + 3: description — editable at all times, dropdown on focus */}
          <div className="relative">
            <input
              ref={descriptionRef}
              type="text"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onFocus={handleDescFocus}
              onBlur={() => setTimeout(() => setShowDescs(false), 150)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {/* Feature 3: recent descriptions dropdown */}
            {showDescs && recentDescs.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <p className="text-xs text-slate-500 px-3 pt-2 pb-1">Recent</p>
                {recentDescs.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDescription(item.description);
                      handleDescriptionChange(item.description);
                      setShowDescs(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors flex items-baseline gap-1.5 min-w-0"
                  >
                    <span className="text-sm text-slate-200 truncate">{item.description}</span>
                    {item.projectName && (
                      <span className="text-xs text-slate-500 flex-shrink-0">— {item.projectName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            onClick={isRunning ? handleStop : () => handleStart()}
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

                  {/* Feature 4: Play button — restart with same project + description */}
                  <button
                    onClick={() => handlePlay(entry)}
                    disabled={isRunning || loading}
                    className="text-slate-700 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Restart this entry"
                    title="Restart"
                  >
                    <Play className="w-4 h-4" />
                  </button>

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
