'use client'

<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { useEffect, useRef } from 'react';
=======
import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
>>>>>>> Stashed changes
=======
import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
>>>>>>> Stashed changes

type SparklesProps = {
  id?: string
  className?: string
  background?: string
  particleColor?: string
  particleDensity?: number
  minSize?: number
  maxSize?: number
  speed?: number
<<<<<<< Updated upstream
}

<<<<<<< Updated upstream
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
=======
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
=======
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
>>>>>>> Stashed changes
      id={id}
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      style={{ background }}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    />
  )
}