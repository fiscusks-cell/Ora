'use client';

import { useEffect, useRef } from 'react';

/**
 * The hero's beam: a generated clip (a light beam with drifting fog on true
 * black) behind the hero content, composited with `mix-blend-mode: lighten`
 * over the Void canvas. Black contributes nothing under lighten, so the clip's
 * own falloff is its edge — nothing is masked or clipped.
 *
 * Geometry lives in globals.css as `.hero-video`, next to `.hero-product`,
 * which is placed from the same numbers: the box is 133vw wide at the clip's
 * own aspect, starting at the hero's top, offset so the clip's beam core
 * (56.8% of its width) sits at 56.8% of the viewport; the product frame's top
 * edge is put on the clip's flare line. Below `lg` the clip is not drawn.
 *
 * Motion: the markup carries no autoplay. On mount, if the visitor has not
 * asked for reduced motion, the clip is started; otherwise the poster (its
 * first frame) stays, so the hero paints the same picture either way.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Set the content attribute too, so Safari's autoplay policy sees muted.
    el.muted = true;
    el.setAttribute('muted', '');
    el.play().catch(() => {
      /* autoplay refused: the poster stays, which is the same first frame */
    });
  }, []);

  return (
    <div aria-hidden="true" className="hero-video pointer-events-none absolute top-0 hidden aspect-video mix-blend-lighten lg:block">
      <video
        ref={ref}
        data-hero-video
        className="h-full w-full object-cover"
        poster="/hero/beam-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
      >
        <source src="/hero/beam.webm" type="video/webm" />
        <source src="/hero/beam.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
