'use client';
import { useEffect, useState } from 'react';
import { SparklesCore } from '@/components/ui/sparkles';

export function OraReveal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center py-12 md:py-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          particleDensity={40}
          minSize={0.6}
          maxSize={1.5}
          particleColor="#FFE600"
          speed={0.3}
          className="w-full h-full"
        />
      </div>

      <div
        className="relative z-10 transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
        }}
      >
        <h2
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter select-none text-center"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: visible ? 'drop-shadow(0 0 30px rgba(255, 230, 0, 0.3))' : 'none',
            transition: 'filter 1.5s ease-out',
          }}
        >
          ORA
        </h2>
        <div
          className="h-0.5 mx-auto mt-3 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: visible ? '60%' : '0%',
            background: 'linear-gradient(90deg, transparent, #FFE600, transparent)',
            transitionDelay: '0.5s',
          }}
        />
      </div>
    </div>
  );
}
