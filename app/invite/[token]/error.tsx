'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[invite/error boundary]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="text-center max-w-sm rounded-2xl p-10"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-lg mb-3" style={{ color: 'var(--text)' }}>
          Something went wrong
        </p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          We couldn&apos;t load this invitation page. Please try again, or ask your admin to
          resend the invite.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-lg text-sm text-white transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            Try again
          </button>
          <Link
            href="/auth/signin"
            className="text-[13px] tracking-[-0.02em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
