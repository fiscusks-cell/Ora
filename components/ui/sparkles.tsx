'use client';

import { useEffect, useRef } from 'react';

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

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  opacitySpeed: number;
  vx: number;
  vy: number;
}

export function SparklesCore({
  background = 'transparent',
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
  particleColor = '#ffffff',
  particleDensity = 100,
  className = '',
}: SparklesCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = init();
    }

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function init(): Particle[] {
      const count = Math.floor((canvas!.width * canvas!.height) / (10000 / particleDensity));
      return Array.from({ length: count }, () => ({
        x: rand(0, canvas!.width),
        y: rand(0, canvas!.height),
        size: rand(minSize, maxSize),
        opacity: rand(0.1, 0.8),
        opacitySpeed: rand(0.003, 0.012) * (Math.random() < 0.5 ? 1 : -1),
        vx: rand(-0.15, 0.15) * speed,
        vy: rand(-0.3, -0.05) * speed,
      }));
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (background !== 'transparent') {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacitySpeed;

        if (p.opacity <= 0.05 || p.opacity >= 0.85) p.opacitySpeed *= -1;

        if (p.y < -5) { p.y = canvas.height + 5; p.x = rand(0, canvas.width); }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [background, minSize, maxSize, speed, particleColor, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
