/**
 * The one beam on the page, in CSS only.
 *
 * Built the way a light source composites rather than the way a shape draws:
 * every layer is a gradient that falls to transparent at its sides and at its
 * foot, so nothing is clipped at a visible edge. (No blend mode: the parent
 * cell is a stacking context once its entrance animation settles, so a blend
 * would see only a transparent backdrop and change nothing.) It enters the
 * hero from above the fold already lit (Electric Iris), pales as it falls,
 * turns to Ember in its lower reach and lands white on the product frame's
 * top edge; the sunburst continues behind the frame.
 *
 * Geometry is tied to the hero's: the parent cell is bottom-aligned in a
 * 980px row, the product frame is 620px tall, so the frame's top is 360px
 * from the hero's top. The beam ends 72px inside the frame (hidden by it)
 * and is 432px tall, so its head is exactly at the hero's top edge and the
 * landing (83%) sits on the frame's edge.
 * Below `lg` the product sits under the copy, so the beam is not drawn.
 */
export function HeroBeam() {
  return (
    <div aria-hidden="true" className="beam-in pointer-events-none absolute inset-x-0 bottom-[calc(100%_-_72px)] hidden h-[432px] lg:block">
      {/* column: Electric Iris, soft on both sides, fading out at the foot */}
      <div
        className="absolute left-[48%] top-0 h-full w-[clamp(240px,28vw,420px)] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(86,131,218,0.2) 28%, rgba(86,131,218,0.7) 44%, rgba(150,178,240,0.95) 50%, rgba(86,131,218,0.7) 56%, rgba(86,131,218,0.2) 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)',
          filter: 'blur(18px)',
        }}
      />
      {/* warm lower reach: Ember Pulse taking over before the landing */}
      <div
        className="absolute left-[48%] top-[30%] h-[76%] w-[clamp(200px,22vw,340px)] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,137,100,0.3) 30%, rgba(255,164,124,0.9) 50%, rgba(255,137,100,0.3) 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 72%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 72%, transparent 100%)',
          filter: 'blur(20px)',
        }}
      />
      {/* core: the line that reads as the beam itself — Iris to white at the landing */}
      <div
        className="absolute left-[48%] top-0 h-full w-[4px] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(180deg, rgba(86,131,218,0.85) 0%, rgba(120,160,235,1) 30%, #dbe4fa 55%, #ffd0bc 72%, #ffffff 80%, rgba(255,255,255,0.9) 85%, rgba(255,255,255,0) 100%)',
          filter: 'blur(0.8px)',
        }}
      />
      {/* the landing: a hot spot on the frame's edge, half behind it */}
      <div
        className="absolute bottom-[4%] left-[48%] h-[120px] w-[260px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,218,196,0.6) 30%, rgba(255,218,196,0) 70%)',
          filter: 'blur(10px)',
        }}
      />
      {/* sunburst where the beam meets the frame */}
      <div
        className="absolute bottom-[2%] left-[48%] h-[64%] w-[min(90vw,1000px)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at 50% 72%, rgba(255,245,230,0.55) 0%, rgba(255,170,129,0.5) 16%, rgba(255,218,159,0.22) 38%, rgba(255,218,159,0) 66%)',
          filter: 'blur(22px)',
        }}
      />
    </div>
  );
}
