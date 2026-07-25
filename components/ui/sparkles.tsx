'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

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