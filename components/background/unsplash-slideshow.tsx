'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UnsplashPhoto } from '@/lib/unsplash';

interface Props {
  photos: UnsplashPhoto[];
  interval?: number; // ms between transitions, default 15000
}

export function UnsplashSlideshow({ photos, interval = 15000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, interval);
    return () => clearInterval(timer);
  }, [photos.length, interval]);

  if (!photos.length) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{
            backgroundImage: `url(${photo.urls.regular})`,
            opacity: i === index ? 0.08 : 0,
          }}
        />
      ))}
      {photos[index] && (
        <div className="fixed bottom-2 right-3 z-10">
          <a
            href={photos[index].user.links.html + '?utm_source=ora&utm_medium=referral'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            Photo by {photos[index].user.name} / Unsplash
          </a>
        </div>
      )}
    </div>
  );
}
