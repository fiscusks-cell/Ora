'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTimerStore } from '@/store/timerStore';

const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

export function IdleTimerWarning() {
  const { isRunning, startedAt } = useTimerStore();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      setShow(false);
      setDismissed(false);
      return;
    }

    function check() {
      if (dismissed) return;
      const elapsed = Date.now() - new Date(startedAt!).getTime();
      if (elapsed >= TEN_HOURS_MS) setShow(true);
    }

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isRunning, startedAt, dismissed]);

  if (!show) return null;

  const elapsed = startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 3600000) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Timer still running</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your timer has been running for over {elapsed} hours. Did you forget to stop it?
            </p>
          </div>
          <button onClick={() => { setShow(false); setDismissed(true); }} className="p-1" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShow(false); setDismissed(true); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Keep running
          </button>
          <button
            onClick={() => {
              useTimerStore.getState().stopTimer();
              setShow(false);
            }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors bg-amber-500 hover:bg-amber-600"
          >
            Stop timer
          </button>
        </div>
      </div>
    </div>
  );
}
