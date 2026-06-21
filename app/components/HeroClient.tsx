'use client';

import dynamic from 'next/dynamic';

export const PerspectiveClockHero = dynamic(
  () => import('./PerspectiveClockHero'),
  { ssr: false }
);

export { default as FeaturesShowcase } from './FeaturesShowcase';
