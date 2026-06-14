'use client';
import { useState, useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { Play, Square } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TimerBarProps {
  projects: Project[];
}

function useElapsed(startedAt: Date | null, isRunning: boolean): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      setElapsed(0);
      return;
    }
    const getElapsed = () =>
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setElapsed(getElapsed());
    const interval = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function TimerBar({ projects }: TimerBarProps) {
  const store = useTimerStore();
  const [isBillable, setIsBillable] = useState(true);
  const [loading, setLoading] = useState(false);
  const elapsed = useElapsed(store.startedAt, store.isRunning);

  async function handleStart() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startedAt: new Date().toISOString(),
          projectId: store.projectId,
          description: store.description,
          isBillable,
        }),
      });
      if (!res.ok) throw new Error('Failed to start timer');
      const data = await res.json();
      store.startTimer(data.id, store.projectId, store.description);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    if (loading || !store.entryId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries/${store.entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stoppedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to stop timer');
      store.stopTimer();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 w-full">
      {/* Project select */}
      <div className="relative">
        <select
          value={store.projectId ?? ''}
          onChange={(e) => store.setProjectId(e.target.value || null)}
          disabled={store.isRunning}
          className="appearance-none bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px]"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {/* Color indicator */}
        {store.projectId && (
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                projects.find((p) => p.id === store.projectId)?.color ?? '#6366f1',
            }}
          />
        )}
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder="What are you working on?"
        value={store.description}
        onChange={(e) => store.setDescription(e.target.value)}
        className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none min-w-0"
      />

      {/* Billable toggle */}
      <label className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          checked={isBillable}
          onChange={(e) => setIsBillable(e.target.checked)}
          disabled={store.isRunning}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-60"
        />
        Billable
      </label>

      {/* Elapsed display when running */}
      {store.isRunning && (
        <span className="font-mono text-sm text-emerald-400 tabular-nums shrink-0">
          {elapsed}
        </span>
      )}

      {/* Start / Stop button */}
      <button
        onClick={store.isRunning ? handleStop : handleStart}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
          store.isRunning
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {store.isRunning ? (
          <>
            <Square size={14} fill="currentColor" />
            Stop
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            Start
          </>
        )}
      </button>
    </div>
  );
}
