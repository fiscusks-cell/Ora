'use client';

import { useEffect, useRef } from 'react';

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

      // Fill with exact page background so canvas edges are seamless
      ctx.fillStyle = '#F5F4EF';
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
      faceGrad.addColorStop(0, '#e8e6df');
      faceGrad.addColorStop(1, '#F5F4EF');
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Face border
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
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
        ctx.strokeStyle = isHour ? 'rgba(71, 85, 105, 0.6)' : 'rgba(148, 163, 184, 0.4)';
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

      // Glowing pillar strands anchored to second hand tip, rotating with it
      const now2 = Date.now() / 1000;
      // Second hand tip in screen space (after perspective scale y*0.6)
      const secTipX = cx + Math.cos(secAngle) * radius * 0.88;
      const secTipY = cy + Math.sin(secAngle) * radius * 0.88 * 0.6;
      const cosSec = Math.cos(secAngle);
      const sinSec = Math.sin(secAngle);

      const strands = [
        { localX: 0,              color: '#FFE600', width: 2.5, height: radius * 1.0, phase: 0 },
        { localX: -radius * 0.06, color: '#FFE600', width: 1.2, height: radius * 0.65, phase: 1.2 },
        { localX:  radius * 0.06, color: '#FFE600', width: 1.2, height: radius * 0.65, phase: 2.1 },
        { localX: -radius * 0.14, color: '#10B981', width: 1.0, height: radius * 0.45, phase: 0.7 },
        { localX:  radius * 0.14, color: '#10B981', width: 1.0, height: radius * 0.45, phase: 1.9 },
        { localX: -radius * 0.24, color: '#10B981', width: 0.7, height: radius * 0.28, phase: 3.1 },
        { localX:  radius * 0.24, color: '#10B981', width: 0.7, height: radius * 0.28, phase: 0.4 },
      ];

      for (const s of strands) {
        const flicker = 0.7 + 0.3 * Math.sin(now2 * 2.3 + s.phase);
        // Rotate local offset along second hand direction
        const x = secTipX + s.localX * cosSec;
        const y = secTipY + s.localX * sinSec * 0.6;
        const r16 = parseInt(s.color.slice(1, 3), 16);
        const g16 = parseInt(s.color.slice(3, 5), 16);
        const b16 = parseInt(s.color.slice(5, 7), 16);
        const base = `rgba(${r16},${g16},${b16},`;
        const grad = ctx.createLinearGradient(x, y, x, y - s.height);
        grad.addColorStop(0, base + (0.7 * flicker) + ')');
        grad.addColorStop(0.4, base + (0.35 * flicker) + ')');
        grad.addColorStop(1, base + '0)');

        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - s.height);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
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
    <div className="absolute inset-0" style={{ background: '#F5F4EF' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
