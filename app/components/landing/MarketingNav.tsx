'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OraWordmark } from '@/components/brand/OraMark';

/**
 * Transparent over the hero, a blurred Void bar once scrolled. `tone` matches the
 * band the nav starts over: dark for the landing hero, light for /pricing.
 */
export function MarketingNav({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onDark = tone === 'dark' || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'bg-void/75 backdrop-blur-md border-b border-slate-edge/50' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        className={`mx-auto flex h-16 max-w-[var(--page-max-width)] items-center justify-between px-5 sm:px-8 ${
          onDark ? 'text-snow' : 'text-void'
        }`}
        aria-label="Primary"
      >
        {/* wordmark and section links as one left group; the links stay hidden below md */}
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="ORA home" className="rounded-buttons">
            <OraWordmark />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#how" className={`text-body transition-colors ${onDark ? 'text-smoke hover:text-snow' : 'text-iron-veil hover:text-void'}`}>
              How it works
            </Link>
            <Link href="/pricing" className={`text-body transition-colors ${onDark ? 'text-smoke hover:text-snow' : 'text-iron-veil hover:text-void'}`}>
              Pricing
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/auth/signin"
            className={`rounded-buttons px-4 py-2 text-body font-medium border transition-colors ${
              onDark
                ? 'border-slate-edge text-snow hover:bg-snow hover:text-void hover:border-snow'
                : 'border-frost text-void hover:bg-void hover:text-snow hover:border-void'
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-buttons bg-electric-iris px-4 py-2 text-body font-medium text-snow transition-[background-color,box-shadow] duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_0_0_4px_rgba(86,131,218,0.22),0_8px_24px_rgba(86,131,218,0.35)]"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
