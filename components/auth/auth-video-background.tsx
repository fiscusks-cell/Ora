"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-viewport looping video background for the signin / signup pages.
 *
 * Assets expected in /public/auth/:
 *   auth-bg.webm         VP9, no audio, ~8-12s seamless loop
 *   auth-bg.mp4          H.264 yuv420p fallback for Safari
 *   auth-bg-poster.jpg   first frame; shown while loading and to reduced-motion users
 *
 * Light-theme variants are optional. If /public/auth/auth-bg-light.* are absent,
 * set HAS_LIGHT_VARIANT to false and the dark clip is used on both themes with a
 * stronger scrim.
 */

const HAS_LIGHT_VARIANT = false;

function useThemeAttribute() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);

    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return reduced;
}

export function AuthVideoBackground() {
  const theme = useThemeAttribute();
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  const useLight = HAS_LIGHT_VARIANT && theme === "light";
  const base = useLight ? "/auth/auth-bg-light" : "/auth/auth-bg";
  const poster = `${base}-poster.jpg`;

  // Force the DOM content attribute (not just the IDL property) so Safari's
  // autoplay policy sees muted=true and permits autoplay on the mp4 fallback.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.setAttribute("muted", "");
    el.play().catch((err) => console.log("video autoplay rejected:", err));
  }, [base, reducedMotion]);

  // Abyssal Ink over the clip so white type stays legible; Bone White when the
  // light theme is running the dark clip, which needs a heavier veil.
  const scrim =
    theme === "light" && !HAS_LIGHT_VARIANT
      ? "linear-gradient(to bottom, rgba(247,247,245,0.86), rgba(247,247,245,0.94))"
      : "linear-gradient(to bottom, rgba(34,47,48,0.55), rgba(34,47,48,0.78))";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {reducedMotion ? (
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          key={base}
          className="h-full w-full object-cover"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          <source src={`${base}.webm`} type="video/webm" />
          <source src={`${base}.mp4`} type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  );
}

export default AuthVideoBackground;
