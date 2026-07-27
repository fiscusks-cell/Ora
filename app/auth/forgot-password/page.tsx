'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Link
        href="/"
        className="fixed top-4 left-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Home
      </Link>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="10" stroke="#3730A3" strokeWidth="1.5" />
            <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
          </svg>
          <span className="text-2xl font-black tracking-tight text-white">ORA</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-6">
                If an account exists for <span className="text-slate-200">{email}</span>, we sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-slate-600 mb-4">The link expires in 1 hour.</p>
              <Link
                href="/auth/signin"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1 text-center text-white">Forgot your password?</h1>
              <p className="text-sm text-slate-400 text-center mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@firm.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <OriginButton
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </OriginButton>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
                <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
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
