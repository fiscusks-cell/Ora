'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

const inputCls =
  'w-full bg-[#f7f7f5] dark:bg-[#1a1f26] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[8px] px-3 py-2.5 text-sm text-[#1a1f26] dark:text-white placeholder-[#8b95a1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

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
      <div className="text-center py-2">
        <p className="font-mono text-[13px] tracking-[-0.02em] text-red-500 mb-6">
          Invalid reset link — no token found.
        </p>
        <Link
          href="/auth/forgot-password"
          className="font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors"
        >
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
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 2500);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-2">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-[28px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white mb-3">
          Password reset
        </h2>
        <p className="font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1]">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  const labelCls = 'font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1] block mb-2';

  return (
    <>
      <h1 className="text-[36px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white text-center mb-2">
        Set new password
      </h1>
      <p className="text-[18px] leading-normal tracking-[-0.001em] font-normal text-[#8b95a1] text-center mb-8">
        Choose a strong password for your account.
      </p>

      {error && (
        <div className="font-mono bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[13px] tracking-[-0.02em] px-3 py-2 rounded-[8px] mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#1a1f26] dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Repeat password"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#1a1f26] dark:hover:text-white transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password strength hints */}
        <ul className="space-y-1.5 pl-1">
          {[
            { ok: password.length >= 8, label: 'At least 8 characters' },
            { ok: /[A-Z]/.test(password), label: 'One uppercase letter' },
            { ok: /[0-9]/.test(password), label: 'One number' },
            { ok: password.length > 0 && password === confirm, label: 'Passwords match' },
          ].map(({ ok, label }) => (
            <li
              key={label}
              className={`font-mono flex items-center gap-1.5 text-[12px] tracking-[-0.02em] ${ok ? 'text-emerald-500' : 'text-[#8b95a1]'}`}
            >
              <span>{ok ? '✓' : '·'}</span> {label}
            </li>
          ))}
        </ul>

        <OriginButton
          type="submit"
          disabled={loading}
          className="font-mono w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors shadow-none"
        >
          {loading ? 'Saving…' : 'Reset password'}
        </OriginButton>
      </form>

      <div className="mt-8 pt-6 border-t border-[#d4d6cf] dark:border-[#3a4550] text-center">
        <Link
          href="/auth/signin"
          className="font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#1a1f26] flex items-center justify-center px-4">
      <Link
        href="/"
        className="font-mono fixed top-5 left-5 text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors"
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
          <span className="text-xl tracking-[-0.04em] text-[#1a1f26] dark:text-white">ORA</span>
        </div>

        <div className="bg-white dark:bg-[#212832] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[20px] p-10">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
