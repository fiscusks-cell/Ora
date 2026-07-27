'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { OriginButton } from '@/components/ui/origin-button';

const interTight = Inter_Tight({ subsets: ['latin'], weight: ['400'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#1a1f26] flex items-center justify-center px-4">
      <Link
        href="/"
        className={`${mono.className} fixed top-5 left-5 text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors`}
      >
        ← Home
      </Link>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="10" stroke="#3730A3" strokeWidth="1.5" />
            <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
          </svg>
          <span className={`${interTight.className} text-xl tracking-[-0.04em] text-[#1a1f26] dark:text-white`}>ORA</span>
        </div>

        <div className="bg-white dark:bg-[#212832] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[20px] p-10">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`${interTight.className} text-[28px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white mb-3`}>
                Check your email
              </h2>
              <p className={`${interTight.className} text-[16px] leading-relaxed tracking-[-0.001em] font-normal text-[#8b95a1] mb-2`}>
                If an account exists for{' '}
                <span className="text-[#1a1f26] dark:text-white">{email}</span>, we sent a reset link. Check your inbox and spam folder.
              </p>
              <p className={`${mono.className} text-[12px] tracking-[-0.02em] text-[#8b95a1] mb-8`}>
                The link expires in 1 hour.
              </p>
              <Link
                href="/auth/signin"
                className={`${mono.className} text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors`}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className={`${interTight.className} text-[36px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white text-center mb-2`}>
                Forgot password?
              </h1>
              <p className={`${interTight.className} text-[18px] leading-normal tracking-[-0.001em] font-normal text-[#8b95a1] text-center mb-8`}>
                We&apos;ll send you a reset link.
              </p>

              {error && (
                <div className={`${mono.className} bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[13px] tracking-[-0.02em] px-3 py-2 rounded-[8px] mb-6`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`${mono.className} text-[13px] tracking-[-0.02em] text-[#8b95a1] block mb-2`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@firm.com"
                    className="w-full bg-[#f7f7f5] dark:bg-[#1a1f26] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[8px] px-3 py-2.5 text-sm text-[#1a1f26] dark:text-white placeholder-[#8b95a1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <OriginButton
                  type="submit"
                  disabled={loading}
                  className={`${mono.className} w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors shadow-none`}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </OriginButton>
              </form>

              <div className="mt-8 pt-6 border-t border-[#d4d6cf] dark:border-[#3a4550] text-center">
                <Link
                  href="/auth/signin"
                  className={`${mono.className} text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors`}
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
