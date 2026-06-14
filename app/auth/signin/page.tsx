'use client';
import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OraLogo() {
  return (
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
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError('Invalid email or password');
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
      <h1 className="text-xl font-bold mb-1 text-center">Welcome back</h1>
      <p className="text-sm text-slate-400 text-center mb-6">Sign in to your ORA workspace</p>

      {justRegistered && !error && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm px-3 py-2 rounded-lg mb-4">
          Account created! Sign in to continue.
        </div>
      )}

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
            placeholder="you@firm.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
        No account?{' '}
        <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
          Create one free
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <OraLogo />
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <p className="text-center text-xs text-slate-600 mt-6">
          Demo: demo@ora.app / password123
        </p>
      </div>
    </div>
  );
}
