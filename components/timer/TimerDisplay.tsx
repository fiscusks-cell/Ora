'use client';
import { useEffect, useState } from 'react';

interface TimerDisplayProps {
  seconds: number;
  isRunning: boolean;
  startedAt?: Date | null;
}

export function TimerDisplay({ seconds: initialSeconds, isRunning, startedAt }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning) {
      setElapsed(initialSeconds);
      return;
    }
    // Compute from startedAt if available for accuracy
    const getElapsed = () => {
      if (startedAt) {
        return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      }
      return elapsed;
    };
    setElapsed(getElapsed());
    const interval = setInterval(() => {
      setElapsed(getElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startedAt, initialSeconds]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const formatted = [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');

  return (
    <div className={`text-7xl font-bold tabular-nums tracking-tight ${isRunning ? 'text-emerald-400' : 'text-slate-300'}`}>
      {formatted}
    </div>
  );
}
