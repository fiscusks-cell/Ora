'use client';
import { useState, useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { Play, Square, PauseCircle } from 'lucide-react';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';

interface Project {
  id: string;
  name: string;
  color: string;
  clientName?: string | null;
}

interface TimerBarProps {
  projects: Project[];
}

function useElapsed(
  startedAt: Date | null,
  isRunning: boolean,
  isPaused: boolean,
  pausedAt: Date | null,
): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // When paused, show frozen elapsed at the exact moment of pause
    if (isPaused && startedAt && pausedAt) {
      setElapsed(
        Math.floor((new Date(pausedAt).getTime() - new Date(startedAt).getTime()) / 1000),
      );
      return;
    }
    if (!isRunning || !startedAt) {
      setElapsed(0);
      return;
    }
    const getElapsed = () =>
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setElapsed(getElapsed());
    const interval = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, startedAt, pausedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function TimerBar({ projects }: TimerBarProps) {
  const store = useTimerStore();
  const [isBillable, setIsBillable] = useState(true);
  const [loading, setLoading] = useState(false);
  const elapsed = useElapsed(store.startedAt, store.isRunning, store.isPaused, store.pausedAt);

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
      {/* Project combobox */}
      <ProjectCombobox
        projects={projects}
        value={store.projectId}
        onChange={(id) => store.setProjectId(id)}
        disabled={store.isRunning || store.isPaused}
        placeholder="Project"
      />

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
          disabled={store.isRunning || store.isPaused}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-60"
        />
        Billable
      </label>

      {/* Elapsed display when running or paused */}
      {(store.isRunning || store.isPaused) && (
        <span
          className={`text-sm tabular-nums shrink-0 ${
            store.isPaused ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          {elapsed}
        </span>
      )}

      {/* Start / Stop / Paused button */}
      {store.isPaused ? (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 opacity-70 cursor-not-allowed text-amber-400 bg-amber-400/10 border border-amber-400/20"
        >
          <PauseCircle size={14} />
          Paused
        </button>
      ) : (
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
      )}
    </div>
  );
}
