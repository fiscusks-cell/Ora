'use client';

import { useEffect, useRef } from 'react';

const COUNT = 35;
const COLOR = '#6366f1'; // indigo-500

interface Dot {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaDelta: number;
}

function makeDot(w: number, h: number): Dot {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1 + Math.random() * 1.5,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -0.15 - Math.random() * 0.2,
    alpha: 0.15 + Math.random() * 0.45,
    alphaDelta: (Math.random() > 0.5 ? 1 : -1) * 0.002,
  };
}

export function AuthParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setSize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    setSize();

    const dots: Dot[] = Array.from({ length: COUNT }, () =>
      makeDot(canvas.width, canvas.height)
    );

    // Reduced motion: draw static dots once and stop
    if (reduced) {
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = COLOR;
        ctx.globalAlpha = d.alpha * 0.6;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    function onResize() {
      setSize();
      // Clamp any dots that are now out of bounds
      for (const d of dots) {
        if (canvas) {
          d.x = Math.min(d.x, canvas.width);
          d.y = Math.min(d.y, canvas.height);
        }
      }
    }
    window.addEventListener('resize', onResize);

    let animId: number;
    function frame() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        d.alpha += d.alphaDelta;
        if (d.alpha > 0.6 || d.alpha < 0.1) d.alphaDelta *= -1;

        // Wrap edges
        if (d.y < -4) { d.y = canvas.height + 4; d.x = Math.random() * canvas.width; }
        if (d.x < -4) d.x = canvas.width + 4;
        if (d.x > canvas.width + 4) d.x = -4;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = COLOR;
        ctx.globalAlpha = d.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
