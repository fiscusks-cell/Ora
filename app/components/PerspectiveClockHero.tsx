'use client';

import { useEffect, useRef } from 'react';
import { OriginLink, OriginButton } from '@/components/ui/origin-button';

export default function PerspectiveClockHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function drawClock() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#050c1b';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.36;

      // Save and apply perspective transform (ellipse effect)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1.0, 0.6);

      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(0, 0, radius * 0.85, 0, 0, radius * 1.1);
      outerGlow.addColorStop(0, 'rgba(255, 230, 0, 0.06)');
      outerGlow.addColorStop(1, 'rgba(255, 230, 0, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Clock face
      const faceGrad = ctx.createRadialGradient(0, -radius * 0.2, 0, 0, 0, radius);
      faceGrad.addColorStop(0, '#0d1f3c');
      faceGrad.addColorStop(1, '#050c1b');
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Face border
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tick marks
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isHour = i % 5 === 0;
        const tickOuter = radius * 0.93;
        const tickInner = isHour ? radius * 0.80 : radius * 0.88;

        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * tickInner, Math.sin(angle) * tickInner);
        ctx.lineTo(Math.cos(angle) * tickOuter, Math.sin(angle) * tickOuter);
        ctx.strokeStyle = isHour ? 'rgba(255, 230, 0, 0.7)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isHour ? 2.5 : 1;
        ctx.stroke();
      }

      // Current time
      const now = new Date();
      const secs = now.getSeconds() + now.getMilliseconds() / 1000;
      const mins = now.getMinutes() + secs / 60;
      const hours = (now.getHours() % 12) + mins / 60;

      const secAngle = (secs / 60) * Math.PI * 2 - Math.PI / 2;
      const minAngle = (mins / 60) * Math.PI * 2 - Math.PI / 2;
      const hourAngle = (hours / 12) * Math.PI * 2 - Math.PI / 2;

      // Hour hand
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 230, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(Math.cos(hourAngle + Math.PI) * radius * 0.12, Math.sin(hourAngle + Math.PI) * radius * 0.12);
      ctx.lineTo(Math.cos(hourAngle) * radius * 0.55, Math.sin(hourAngle) * radius * 0.55);
      ctx.strokeStyle = '#FFE600';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      // Minute hand
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(Math.cos(minAngle + Math.PI) * radius * 0.14, Math.sin(minAngle + Math.PI) * radius * 0.14);
      ctx.lineTo(Math.cos(minAngle) * radius * 0.78, Math.sin(minAngle) * radius * 0.78);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      // Second hand
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 80, 80, 0.8)';
      ctx.beginPath();
      ctx.moveTo(Math.cos(secAngle + Math.PI) * radius * 0.18, Math.sin(secAngle + Math.PI) * radius * 0.18);
      ctx.lineTo(Math.cos(secAngle) * radius * 0.88, Math.sin(secAngle) * radius * 0.88);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      // Center cap
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 230, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE600';
      ctx.fill();
      ctx.restore();

      ctx.restore(); // end perspective transform
    }

    function loop() {
      drawClock();
      animId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden" style={{ background: '#050c1b' }}>
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#050c1b_80%)]" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-xs font-semibold mb-8 uppercase tracking-widest">
          Time Tracking · Invoicing · Insights
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 max-w-4xl">
          Time tracker for<br />
          <span className="text-[#FFE600]">Freelancers</span> and More
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Track hours. Approve periods. Push to QuickBooks or Xero automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <OriginLink
            href="/auth/signup"
            className="px-8 py-4 bg-[#FFE600] hover:bg-yellow-300 text-black font-bold rounded-xl text-base transition-colors"
          >
            Start free →
          </OriginLink>
          <OriginButton className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl text-base transition-colors backdrop-blur-sm">
            See how it works
          </OriginButton>
        </div>
        <p className="text-slate-600 text-sm mt-6">No credit card required · Free forever on solo plan</p>
      </div>
    </div>
  );
}
