'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── shared ripple hook ───────────────────────────────────────────────────────

function useRipple() {
  const elRef = useRef<HTMLElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const keyRef = useRef(0);

  function onMouseEnter(e: React.MouseEvent<HTMLElement>) {
    const rect = elRef.current!.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: ++keyRef.current });
  }

  function onMouseLeave() {
    setRipple(null);
  }

  const size = elRef.current
    ? Math.hypot(elRef.current.offsetWidth, elRef.current.offsetHeight) * 2.2
    : 600;

  return { elRef, ripple, size, onMouseEnter, onMouseLeave };
}

// ─── ripple layer ─────────────────────────────────────────────────────────────

function RippleLayer({ ripple, size }: { ripple: { x: number; y: number; key: number } | null; size: number }) {
  return (
    <AnimatePresence>
      {ripple && (
        <motion.span
          key={ripple.key}
          className="pointer-events-none absolute rounded-full bg-white/15"
          style={{ width: size, height: size, left: ripple.x - size / 2, top: ripple.y - size / 2 }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── OriginButton — for <button> elements ────────────────────────────────────

interface OriginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function OriginButton({ children, className = '', disabled, ...rest }: OriginButtonProps) {
  const { elRef, ripple, size, onMouseEnter, onMouseLeave } = useRipple();

  return (
    <button
      {...rest}
      ref={elRef as React.Ref<HTMLButtonElement>}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative overflow-hidden isolate ${className}`}
    >
      <RippleLayer ripple={disabled ? null : ripple} size={size} />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

// ─── OriginLink — for Next.js <Link> / <a> elements ──────────────────────────

import Link from 'next/link';
import type { LinkProps } from 'next/link';

interface OriginLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export function OriginLink({ children, className = '', ...rest }: OriginLinkProps) {
  const { elRef, ripple, size, onMouseEnter, onMouseLeave } = useRipple();

  return (
    <Link
      {...rest}
      ref={elRef as React.Ref<HTMLAnchorElement>}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative overflow-hidden isolate ${className}`}
    >
      <RippleLayer ripple={ripple} size={size} />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </Link>
  );
}
