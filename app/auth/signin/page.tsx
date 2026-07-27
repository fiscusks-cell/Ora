'use client';
import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { OriginButton } from '@/components/ui/origin-button';

const interTight = Inter_Tight({ subsets: ['latin'], weight: ['400'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'] });

const inputCls =
  'w-full bg-[#f7f7f5] dark:bg-[#1a1f26] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[8px] px-3 py-2.5 text-sm text-[#1a1f26] dark:text-white placeholder-[#8b95a1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'text-[13px] tracking-[-0.02em] text-[#8b95a1] block mb-2';
const btnCls =
  'w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors shadow-none';

function OraLogo() {
  return (
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
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (!result || result.error) {
      setError('Invalid email or password');
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <>
      <h1 className={`${interTight.className} text-[36px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white text-center mb-2`}>
        Welcome back
      </h1>
      <p className={`${interTight.className} text-[18px] leading-normal tracking-[-0.001em] font-normal text-[#8b95a1] text-center mb-8`}>
        Sign in to your ORA workspace
      </p>

      {justRegistered && !error && (
        <div className={`${mono.className} bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[13px] tracking-[-0.02em] px-3 py-2 rounded-[8px] mb-6`}>
          Account created — sign in to continue.
        </div>
      )}
      {error && (
        <div className={`${mono.className} bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[13px] tracking-[-0.02em] px-3 py-2 rounded-[8px] mb-6`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={`${mono.className} ${labelCls}`}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@firm.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${mono.className} ${labelCls}`}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#1a1f26] dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end -mt-1">
          <Link
            href="/auth/forgot-password"
            className={`${mono.className} text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors`}
          >
            Forgot password?
          </Link>
        </div>
        <OriginButton type="submit" disabled={loading} className={`${mono.className} ${btnCls}`}>
          {loading ? 'Signing in…' : 'Sign in'}
        </OriginButton>
      </form>

      <div className="mt-8 pt-6 border-t border-[#d4d6cf] dark:border-[#3a4550] text-center">
        <span className={`${mono.className} text-[13px] tracking-[-0.02em] text-[#8b95a1]`}>
          No account?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline">
            Create one free
          </Link>
        </span>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#1a1f26] flex items-center justify-center px-4">
      <Link
        href="/"
        className={`${mono.className} fixed top-5 left-5 text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors`}
      >
        ← Home
      </Link>
      <div className="w-full max-w-sm">
        <OraLogo />
        <div className="bg-white dark:bg-[#212832] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[20px] p-10">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
        </div>
        <p className={`${mono.className} text-center text-[12px] tracking-[-0.02em] text-[#8b95a1] mt-6`}>
          Demo: demo@ora.app / password123
        </p>
      </div>
    </div>
  );
}
