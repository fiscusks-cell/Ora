'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { MoveDirection, OutMode } from '@tsparticles/engine'
import type { ISourceOptions } from '@tsparticles/engine'

type SparklesProps = {
  id?: string
  className?: string
  background?: string
  particleColor?: string
  particleDensity?: number
  minSize?: number
  maxSize?: number
  speed?: number
}

export const SparklesCore = ({
  id,
  className,
  background = 'transparent',
  particleColor = '#FFE600',
  particleDensity = 80,
  minSize = 0.4,
  maxSize = 1.2,
  speed = 0.8,
}: SparklesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: particleDensity }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: Math.random(),
      speed: (speed * 0.3) * (0.5 + Math.random()),
      opacitySpeed: 0.005 + Math.random() * 0.01,
      opacityDirection: Math.random() > 0.5 ? 1 : -1,
    }))

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.y -= p.speed
        p.opacity += p.opacitySpeed * p.opacityDirection
        if (p.opacity >= 1 || p.opacity <= 0) p.opacityDirection *= -1
        if (p.y < 0) p.y = canvas.height
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = particleColor
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        ctx.fill()
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [particleColor, particleDensity, minSize, maxSize, speed])

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      style={{ background }}
    />
  )
}

// ─── tsparticles-backed ambient sparkles ─────────────────────────────────────

interface SparklesAmbientProps {
  particleColor?: string;
  particleDensity?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export function Sparkles({
  particleColor = '#4f46e5',
  particleDensity = 40,
  minSize = 1,
  maxSize = 2,
  speed = 1.5,
}: SparklesAmbientProps) {
  // Default true so prefers-reduced-motion users never flash particles during hydration
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        color: { value: particleColor },
        number: { value: particleDensity, density: { enable: true } },
        opacity: { value: { min: 0.1, max: 0.6 } },
        size: { value: { min: minSize, max: maxSize } },
        move: {
          enable: true,
          speed,
          direction: MoveDirection.none,
          random: true,
          outModes: { default: OutMode.out },
        },
        links: { enable: false },
      },
      detectRetina: true,
      interactivity: {
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
        },
      },
    }),
    [particleColor, particleDensity, minSize, maxSize, speed],
  );

  if (reducedMotion) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        maskImage: 'radial-gradient(50% 50%, transparent, white)',
        WebkitMaskImage: 'radial-gradient(50% 50%, transparent, white)',
      }}
      aria-hidden="true"
    >
      <ParticlesProvider init={loadSlim}>
        <Particles id="ora-sparkles" options={options} className="h-full w-full" />
      </ParticlesProvider>
    </div>
  );
}