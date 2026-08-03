import Link from 'next/link';
import { PricingSection } from '@/components/pricing-section';

const BG = '#f8f7f4';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="10" stroke="#3730A3" strokeWidth="1.5" />
        <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-[#1a1f26]">ORA</span>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-14"
        style={{ background: 'rgba(248,247,244,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #d4d6cf' }}
      >
        <Link href="/" aria-label="ORA home">
          <Logo />
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/auth/signin"
            className="text-[13px] text-[#8b95a1] hover:text-[#1a1f26] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-[13px] px-4 py-2 rounded-[8px] text-white transition-colors"
            style={{ background: '#4f46e5' }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Pricing section */}
      <PricingSection />

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{ borderTop: '1px solid #d4d6cf' }}
      >
        <p className="text-[12px] text-[#8b95a1]">
          &copy; {new Date().getFullYear()} ORA &middot; Powered by Fiscus LLC
        </p>
      </footer>
    </div>
  );
}
