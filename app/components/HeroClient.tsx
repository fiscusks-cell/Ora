'use client';

import dynamic from 'next/dynamic';

export const PerspectiveClockHero = dynamic(
  () => import('./PerspectiveClockHero'),
  { ssr: false }
);

export const SparklesCore = dynamic(
  () => import('@/components/ui/sparkles').then((m) => ({ default: m.SparklesCore })),
  { ssr: false }
);
