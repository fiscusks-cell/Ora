'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTimerStore } from '@/store/timerStore';

const TEN_HOURS_S = 36000;
const AUTO_STOP_S = 120;

export function IdleTimerWarning() {
  const { isRunning, isPaused, startedAt, pauseTimer, resumeTimer, stopTimer } = useTimerStore();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_STOP_S);
  const [stopping, setStopping] = useState(false);
  const stoppingRef = useRef(false);

  // Show immediately if already paused on mount (persisted state after page reload)
  useEffect(() => {
    if (useTimerStore.getState().isPaused) setShow(true);
  }, []);

  const doStop = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    setStopping(true);
    const { entryId, pausedAt } = useTimerStore.getState();
    if (entryId && pausedAt) {
      try {
        await fetch(`/api/time-entries/${entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          // Use pausedAt as stoppedAt so the entry records exactly 10 hours
          body: JSON.stringify({ stoppedAt: new Date(pausedAt).toISOString() }),
        });
      } catch { /* ignore network error */ }
    }
    stopTimer();
    setShow(false);
    stoppingRef.current = false;
    setStopping(false);
  }, [stopTimer]);

  const doResume = useCallback(() => {
    resumeTimer();
    setShow(false);
  }, [resumeTimer]);

  // Keep a fresh ref for the auto-stop timeout so it calls the current doStop
  const doStopRef = useRef(doStop);
  useEffect(() => { doStopRef.current = doStop; }, [doStop]);

  // Check for 10-hour threshold every 10 seconds
  useEffect(() => {
    if (!isRunning || !startedAt || isPaused) return;

    function check() {
      if (!startedAt) return;
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      if (elapsed >= TEN_HOURS_S) {
        pauseTimer();
        setShow(true);
      }
    }

    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [isRunning, startedAt, isPaused, pauseTimer]);

  // Auto-stop countdown while modal is visible
  useEffect(() => {
    if (!show) {
      setCountdown(AUTO_STOP_S);
      return;
    }

    setCountdown(AUTO_STOP_S);
    const countId = setInterval(() => setCountdown((p) => Math.max(0, p - 1)), 1000);
    const stopId = setTimeout(() => doStopRef.current(), AUTO_STOP_S * 1000);

    return () => {
      clearInterval(countId);
      clearTimeout(stopId);
    };
  }, [show]);

  if (!show || !isPaused) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="p-2.5 rounded-full shrink-0"
            style={{ background: 'rgba(99, 102, 241, 0.12)' }}
          >
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              Are you still working?
            </h3>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your timer has been paused after 10 hours. The session will auto-stop in{' '}
              <span className="font-semibold">{countdown}s</span> if you don&apos;t respond.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={doResume}
            disabled={stopping}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            Yes, still working
          </button>
          <button
            onClick={doStop}
            disabled={stopping}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {stopping ? 'Stopping…' : 'Stop session'}
          </button>
        </div>
      </div>
    </div>
  );
}
