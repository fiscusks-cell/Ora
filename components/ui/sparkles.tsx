'use client';

import { useEffect, useId, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
  className?: string;
}

export function SparklesCore({
  id,
  background = 'transparent',
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
  particleColor = '#ffffff',
  particleDensity = 100,
  className = '',
}: SparklesCoreProps) {
  const [engineReady, setEngineReady] = useState(false);
  const generatedId = useId();
  const particleId = id ?? generatedId;

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const options: ISourceOptions = {
    background: { color: { value: background } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: {
        value: particleDensity,
        density: { enable: true },
      },
      color: { value: particleColor },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.8 },
        animation: {
          enable: true,
          speed: 1.5,
          sync: false,
        },
      },
      size: {
        value: { min: minSize, max: maxSize },
      },
      move: {
        enable: true,
        speed: speed,
        direction: 'none',
        random: true,
        straight: false,
        outModes: { default: 'out' },
      },
    },
    detectRetina: true,
  };

  if (!engineReady) return null;

  return (
    <Particles
      id={particleId}
      className={className}
      options={options}
    />
  );
}
