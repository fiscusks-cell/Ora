'use client';

import { useEffect, useRef } from 'react';

/**
 * The hero's beam: a generated clip (a light beam with drifting fog on true
 * black) behind the hero content, composited with `mix-blend-mode: lighten`
 * over the Void canvas. Black contributes nothing under lighten, so the clip's
 * own falloff is its edge — nothing is masked or clipped.
 *
 * Geometry lives in globals.css as `.hero-video` (it is tied to the hero grid):
 * the box is max(133vw, 1743px) wide so the clip always scales by width and
 * covers the 980px hero, and it is offset so the clip's beam core (56.8% of
 * its width) sits where the hero's beam belongs — 48% across the product
 * column. Below `lg` the product sits under the copy and there is no x that
 * keeps the beam off the text, so the clip is not drawn.
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
    <div aria-hidden="true" className="hero-video pointer-events-none absolute top-0 hidden h-full mix-blend-lighten lg:block">
      <video
        ref={ref}
        data-hero-video
        className="h-full w-full object-cover"
        poster="/hero/beam-poster.jpg"
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      >
        <source src="/hero/beam.webm" type="video/webm" />
        <source src="/hero/beam.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
