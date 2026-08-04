'use client';
import { useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';

// Matches app/layout.tsx metadata — defined here as a constant so cleanup
// always restores a known-good title rather than capturing document.title at
// effect time (which may fire before Next.js applies route metadata on load).
const BASE_TITLE = 'ORA — Time, tracked. Invoices, done.';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function buildBadgedFavicon(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 32, 32);
      ctx.beginPath();
      ctx.arc(26, 26, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = '/favicon.ico';
  });
}

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function TabSignal() {
  const isRunning = useTimerStore((s) => s.isRunning);
  const startedAt = useTimerStore((s) => s.startedAt);

  useEffect(() => {
    if (!isRunning || !startedAt) return;

    // startedAt is a Date in memory but an ISO string after Zustand rehydrates
    // from localStorage — new Date(x) handles both.
    const startMs = new Date(startedAt as unknown as string).getTime();
    let cancelled = false;

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      document.title = `● ${formatElapsed(elapsed)} · ORA`;
    };

    tick();
    const id = setInterval(tick, 1000);

    buildBadgedFavicon()
      .then((dataUrl) => { if (!cancelled) getFaviconLink().href = dataUrl; })
      .catch(() => { /* favicon badge is non-critical */ });

    return () => {
      cancelled = true;
      clearInterval(id);
      document.title = BASE_TITLE;
      getFaviconLink().href = '/favicon.ico';
    };
  }, [isRunning, startedAt]);

  return null;
}
