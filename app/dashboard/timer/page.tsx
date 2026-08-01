'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Play, Square, DollarSign, MoreHorizontal } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';
import { useTimerStore } from '@/store/timerStore';

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
  project: {
    id: string;
    name: string;
    color: string;
    client: { id: string; name: string } | null;
  } | null;
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

function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mma');
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [entryId, setEntryId] = useState<string | null>(null);

  const storePaused = useTimerStore((state) => state.isPaused);
  const storeStartedAt = useTimerStore((state) => state.startedAt);
  const wasPausedRef = useRef(false);

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [recentDescs, setRecentDescs] = useState<RecentDesc[]>([]);
  const [showDescs, setShowDescs] = useState(false);

  const [openKebab, setOpenKebab] = useState<string | null>(null);

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
      setDescription(active.description ?? '');
      setProjectId(active.project?.id ?? '');
      if (!useTimerStore.getState().isPaused) {
        setIsRunning(true);
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
      }
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

  // ── store pause/resume sync ───────────────────────────────────────────────

  useEffect(() => {
    if (storePaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsed(36000);
      setIsRunning(false);
      wasPausedRef.current = true;
    }
  }, [storePaused]);

  useEffect(() => {
    if (!storePaused && wasPausedRef.current && storeStartedAt) {
      wasPausedRef.current = false;
      const start = new Date(storeStartedAt);
      setStartedAt(start);
      setIsRunning(true);
    }
  }, [storePaused, storeStartedAt]);

  // ── start / stop ──────────────────────────────────────────────────────────

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

  // ── description real-time save ────────────────────────────────────────────

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

  // ── recent descriptions dropdown ──────────────────────────────────────────

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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6" onClick={() => setOpenKebab(null)}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Description */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={descriptionRef}
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onFocus={handleDescFocus}
            onBlur={() => setTimeout(() => setShowDescs(false), 150)}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--text)' }}
          />
          {showDescs && recentDescs.length > 0 && (
            <div
              className="absolute z-20 top-full left-0 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs px-3 pt-2 pb-1" style={{ color: 'var(--text-muted)' }}>Recent</p>
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
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-baseline gap-1.5 min-w-0"
                >
                  <span className="text-sm truncate" style={{ color: 'var(--text)' }}>
                    {item.description}
                  </span>
                  {item.projectName && (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      — {item.projectName}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project selector */}
        <ProjectCombobox
          projects={projects}
          value={projectId || null}
          onChange={(id) => setProjectId(id ?? '')}
          disabled={isRunning}
          placeholder="No project"
        />

        {/* Billable toggle */}
        <button
          type="button"
          onClick={() => { if (!isRunning) setIsBillable((b) => !b); }}
          disabled={isRunning}
          className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
          title={isBillable ? 'Billable' : 'Not billable'}
        >
          <DollarSign
            className="w-4 h-4"
            style={{ color: isBillable ? 'var(--accent)' : 'var(--text-muted)' }}
          />
        </button>

        {/* Elapsed */}
        <span
          className="text-xl tabular-nums tracking-tight flex-shrink-0 select-none"
          style={{
            color: storePaused ? '#f59e0b' : isRunning ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {formatElapsed(elapsed)}
        </span>

        {/* Start / Stop */}
        <OriginButton
          onClick={isRunning ? handleStop : () => handleStart()}
          disabled={loading || storePaused}
          className="flex-shrink-0 px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          style={{
            background: storePaused
              ? 'rgba(245,158,11,0.15)'
              : isRunning
              ? 'var(--error)'
              : 'var(--accent)',
            color: storePaused ? '#f59e0b' : 'white',
          }}
        >
          {storePaused ? (
            'Paused'
          ) : isRunning ? (
            <><Square className="w-3.5 h-3.5" />Stop</>
          ) : (
            <><Play className="w-3.5 h-3.5" />Start</>
          )}
        </OriginButton>
      </div>

      {/* ── Entry list ───────────────────────────────────────────────────── */}
      {todayEntries.length === 0 ? (
        <p className="text-center text-sm py-12" style={{ color: 'var(--text-muted)' }}>
          No entries today.
        </p>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {/* Day header */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(), 'EEE, MMM d')}
            </span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {formatHM(todayTotal)}
            </span>
          </div>

          {/* Rows */}
          {todayEntries.map((entry, i) => {
            const seconds = entry.durationSeconds ?? 0;
            const notLast = i < todayEntries.length - 1;
            return (
              <div
                key={entry.id}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                style={notLast ? { borderBottom: '1px solid var(--border)' } : undefined}
              >
                {/* Description */}
                <span className="flex-1 text-sm truncate min-w-0" style={{ color: 'var(--text)' }}>
                  {entry.description ?? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No description
                    </span>
                  )}
                </span>

                {/* Project dot + name */}
                {entry.project && (
                  <>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: entry.project.color }}
                    />
                    <span
                      className="text-sm flex-shrink-0 max-w-[120px] truncate"
                      style={{ color: entry.project.color }}
                    >
                      {entry.project.name}
                    </span>
                  </>
                )}

                {/* Client */}
                {entry.project?.client && (
                  <span className="text-sm flex-shrink-0 hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    — {entry.project.client.name}
                  </span>
                )}

                {/* Billable */}
                {entry.isBillable && (
                  <DollarSign
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                )}

                {/* Time range */}
                <span
                  className="text-xs flex-shrink-0 hidden sm:block"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {formatTime(entry.startedAt)}
                  {entry.stoppedAt ? ` – ${formatTime(entry.stoppedAt)}` : ''}
                </span>

                {/* Duration */}
                <span className="text-sm tabular-nums flex-shrink-0" style={{ color: 'var(--text)' }}>
                  {formatHM(seconds)}
                </span>

                {/* Play */}
                <button
                  onClick={() => handlePlay(entry)}
                  disabled={isRunning || loading}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity disabled:cursor-not-allowed"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    if (!isRunning && !loading) e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  aria-label="Restart this entry"
                >
                  <Play className="w-4 h-4" />
                </button>

                {/* Kebab */}
                <div
                  className="relative flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenKebab(openKebab === entry.id ? null : entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Entry options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openKebab === entry.id && (
                    <div
                      className="absolute right-0 bottom-full mb-1 w-28 rounded-lg shadow-lg py-1 z-30"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <button
                        onClick={() => { handleDelete(entry.id); setOpenKebab(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--error)' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
