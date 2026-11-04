import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OraWordmark } from '@/components/brand/OraMark';
import { AuthVideoBackground } from '@/components/auth/auth-video-background';

/**
 * The frame every auth page shares: the looping video behind a theme-aware
 * scrim, the home link, the wordmark, and one panel floating over it.
 * Theme follows [data-theme] through the semantic utilities, so the panel and
 * the scrim always agree.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ora-fade relative flex min-h-screen items-center justify-center px-4 py-12 text-ink">
      <AuthVideoBackground />

      <Link
        href="/"
        className="fixed left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-buttons text-body text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Home
      </Link>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="ORA home" className="rounded-buttons text-ink">
            <OraWordmark size={30} />
          </Link>
        </div>
        <div className="rounded-cards border border-line bg-panel p-7 shadow-elevation-xl sm:p-9">{children}</div>
      </div>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-display-sm font-semibold text-ink [text-wrap:balance]">{title}</h1>
      {subtitle && <p className="mt-2 text-body-lg text-ink-secondary">{subtitle}</p>}
    </div>
  );
}
