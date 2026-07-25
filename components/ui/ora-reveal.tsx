'use client';

import { useEffect, useState } from 'react';
import { SparklesCore } from '@/components/ui/sparkles';

export function OraReveal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-10 select-none">
      {/* Particle background behind text */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          particleDensity={40}
          minSize={0.3}
          maxSize={0.9}
          particleColor="#FFE600"
          speed={0.5}
          background="transparent"
        />
      </div>

      {/* ORA text */}
      <div
        className="relative z-10 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
        }}
      >
        <span
          className="text-6xl md:text-8xl font-black tracking-[0.15em] leading-none"
          style={{
            background: 'linear-gradient(135deg, #FFE600 0%, #F59E0B 40%, #10B981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px rgba(255,230,0,0.4))',
          }}
        >
          ORA
        </span>
      </div>

      {/* Animated underline */}
      <div
        className="relative z-10 mt-2 h-0.5 rounded-full transition-all duration-1000 delay-300"
        style={{
          width: visible ? '80px' : '0px',
          background: 'linear-gradient(90deg, #FFE600, #10B981)',
          boxShadow: '0 0 8px rgba(255,230,0,0.6)',
        }}
      />
    </div>
  );
}
