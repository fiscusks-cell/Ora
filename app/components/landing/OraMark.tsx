/**
 * The ORA mark: the clock geometry the product has always used, recolored to the
 * system. Strokes take `currentColor` so the mark sits on dark or light; the
 * minute hand and pivot carry Ember Pulse as the one warm note.
 */
export function OraMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.25" />
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <line x1="16" y1="16" x2="21.5" y2="19" stroke="var(--color-ember-pulse)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.6" fill="var(--color-ember-pulse)" />
    </svg>
  );
}

export function OraWordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <OraMark size={size} />
      <span className="font-display font-semibold tracking-[0.14em] text-[1.05rem] leading-none select-none">ORA</span>
    </span>
  );
}
