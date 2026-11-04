import Link from 'next/link';
import { OraWordmark } from '@/components/brand/OraMark';

export function MarketingFooter() {
  return (
    <footer className="bg-void text-snow border-t border-slate-edge/60">
      <div className="mx-auto flex max-w-[var(--page-max-width)] flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
        <OraWordmark />
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link href="/#how" className="text-body text-smoke transition-colors hover:text-snow">How it works</Link>
          <Link href="/pricing" className="text-body text-smoke transition-colors hover:text-snow">Pricing</Link>
          <Link href="/auth/signin" className="text-body text-smoke transition-colors hover:text-snow">Sign in</Link>
          <Link href="/auth/signup" className="text-body text-smoke transition-colors hover:text-snow">Sign up</Link>
        </nav>
      </div>
      <div className="border-t border-slate-edge/40">
        <p className="mx-auto max-w-[var(--page-max-width)] px-5 py-6 text-caption text-smoke sm:px-8">
          &copy; {new Date().getFullYear()}{' '}ORA &middot; Powered by Fiscus LLC
        </p>
      </div>
    </footer>
  );
}
