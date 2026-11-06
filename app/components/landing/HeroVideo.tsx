'use client';

import { useEffect, useRef } from 'react';

/**
 * The hero's background: a generated clip that carries the whole composition
 * — a beam coming down into a rounded window frame with a glowing top edge,
 * fog in the dark greys behind. It is a complete picture, not light on black,
 * so it is drawn as a plain layer (no blend mode) filling the hero with
 * object-fit: cover. The hero is sized to the clip's 16:9, so nothing is
 * cropped and the frame's position in the clip is the frame's position on the
 * page: the product mockup is placed inside it from globals.css (.hero-product).
 * Below `lg` the hero stacks copy over product on Void and the clip is off.
 *
 * Motion: the markup carries no autoplay. On mount, if the visitor has not
 * asked for reduced motion, the clip is started; otherwise the poster (frame
 * 0) stays, so the hero paints the same picture either way.
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
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
