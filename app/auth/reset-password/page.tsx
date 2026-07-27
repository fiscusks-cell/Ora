'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-4">Invalid reset link. No token found.</p>
        <Link href="/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300 text-sm">
          Request a new link
        </Link>
      </div>
    );
  }

  const validationError = (): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validationError();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 2500);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password reset!</h2>
        <p className="text-sm text-slate-400">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-1 text-center text-white">Set new password</h1>
      <p className="text-sm text-slate-400 text-center mb-6">
        Choose a strong password for your account.
      </p>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Repeat password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password strength hints */}
        <ul className="text-xs space-y-1 pl-1">
          {[
            { ok: password.length >= 8, label: 'At least 8 characters' },
            { ok: /[A-Z]/.test(password), label: 'One uppercase letter' },
            { ok: /[0-9]/.test(password), label: 'One number' },
            { ok: password.length > 0 && password === confirm, label: 'Passwords match' },
          ].map(({ ok, label }) => (
            <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span>{ok ? '✓' : '·'}</span> {label}
            </li>
          ))}
        </ul>

        <OriginButton
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Saving…' : 'Reset password'}
        </OriginButton>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
        <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
