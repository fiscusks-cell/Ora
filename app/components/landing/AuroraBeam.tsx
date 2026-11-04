/**
 * The one aurora beam on the page: a narrow vertical streak of Electric Iris
 * melting into Ember Pulse and white, with a warm sunburst at its base. A bright
 * core line inside a soft glow, so it reads as a beam and not a smudge. Pure
 * CSS; the hero section clips it and it fades in once (see .aurora-in).
 *
 * Geometry: in the two-column hero the core stands in the gap between the copy
 * and the product frame. The gap's center is ~51% of the viewport at 1024,
 * 1280 and 1440 alike, because the container is centered and the column split
 * is fixed. The gap is only 64px wide, so the glow is offset right and masked
 * on its left edge: it trails onto the opaque frame, never onto the copy. In the
 * stacked layout the beam has to cross the copy, so the glow drops to 60%.
 */
const CORE_X = 'left-[62%] lg:left-[51%]';

export function AuroraBeam() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* glow — offset to the right of the core, left edge masked away */}
      <div
        className="aurora-in absolute left-[62%] top-[-10%] h-[122%] w-[min(18vw,220px)] min-w-[120px] -translate-x-1/2 max-lg:opacity-60 lg:left-[calc(51%+56px)]"
        style={{
          background:
            'linear-gradient(180deg, rgba(86,131,218,0) 0%, rgba(86,131,218,0.75) 16%, rgba(86,131,218,0.9) 40%, rgba(255,137,100,0.95) 68%, rgba(255,255,255,0.9) 100%)',
          filter: 'blur(28px)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 48%, #000 100%)',
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 48%, #000 100%)',
        }}
      />
      {/* core */}
      <div
        className={`aurora-in absolute top-[-10%] h-[122%] w-[3px] -translate-x-1/2 ${CORE_X}`}
        style={{
          background:
            'linear-gradient(180deg, rgba(86,131,218,0) 0%, #5683da 18%, #7a9be6 40%, #ff8964 70%, #ffffff 100%)',
          filter: 'blur(1px)',
          opacity: 0.95,
        }}
      />
      {/* sunburst at the base */}
      <div
        className={`aurora-in absolute bottom-[-34%] h-[72%] w-[min(64vw,820px)] -translate-x-1/2 ${CORE_X}`}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,170,129,0.6) 0%, rgba(255,218,159,0.3) 30%, rgba(255,218,159,0) 68%)',
          filter: 'blur(26px)',
          animationDelay: '150ms',
        }}
      />
    </div>
  );
}
