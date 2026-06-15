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

      ctx.clearRect(0, 0, w, h);

      // Clear to transparent so sparkles show through
      ctx.clearRect(0, 0, w, h);

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

      // Glowing pillar strands rising from top of clock ellipse
      const ellipseTopY = cy - radius * 0.6; // top of the perspective-scaled ellipse
      const now2 = Date.now() / 1000;
      const strands = [
        { xOff: 0,           color: '#FFE600', width: 2.5, height: radius * 1.1, phase: 0 },
        { xOff: -radius * 0.18, color: '#FFE600', width: 1.2, height: radius * 0.7, phase: 1.2 },
        { xOff:  radius * 0.18, color: '#FFE600', width: 1.2, height: radius * 0.75, phase: 2.1 },
        { xOff: -radius * 0.38, color: '#10B981', width: 1.0, height: radius * 0.5, phase: 0.7 },
        { xOff:  radius * 0.38, color: '#10B981', width: 1.0, height: radius * 0.55, phase: 1.9 },
        { xOff: -radius * 0.6,  color: '#10B981', width: 0.7, height: radius * 0.3, phase: 3.1 },
        { xOff:  radius * 0.6,  color: '#10B981', width: 0.7, height: radius * 0.32, phase: 0.4 },
      ];

      for (const s of strands) {
        const flicker = 0.7 + 0.3 * Math.sin(now2 * 2.3 + s.phase);
        const x = cx + s.xOff;
        const grad = ctx.createLinearGradient(x, ellipseTopY, x, ellipseTopY - s.height);
        grad.addColorStop(0, s.color.replace('#', 'rgba(') + ',0.0)'); // opaque base
        // parse hex to rgba properly
        const r16 = parseInt(s.color.slice(1, 3), 16);
        const g16 = parseInt(s.color.slice(3, 5), 16);
        const b16 = parseInt(s.color.slice(5, 7), 16);
        const base = `rgba(${r16},${g16},${b16},`;
        const grad2 = ctx.createLinearGradient(x, ellipseTopY, x, ellipseTopY - s.height);
        grad2.addColorStop(0, base + (0.6 * flicker) + ')');
        grad2.addColorStop(0.4, base + (0.35 * flicker) + ')');
        grad2.addColorStop(1, base + '0)');

        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.moveTo(x, ellipseTopY);
        ctx.lineTo(x, ellipseTopY - s.height);
        ctx.strokeStyle = grad2;
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
    <div className="absolute inset-0" style={{ background: 'transparent' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
