'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import { SparklesCore } from '@/components/ui/sparkles';

const inputCls =
  'w-full bg-[#f7f7f5] dark:bg-[#1a1f26] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[8px] px-3 py-2.5 text-sm text-[#1a1f26] dark:text-white placeholder-[#8b95a1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const btnCls =
  'font-mono w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors shadow-none';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', orgName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || data.message || 'Something went wrong');
      setLoading(false);
      return;
    }
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (!result || result.error) {
      window.location.href = '/auth/signin?registered=1';
    } else {
      window.location.href = '/dashboard';
    }
  }

  const labelCls = 'font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1] block mb-2';

  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#1a1f26] flex items-center justify-center px-4 py-8">
      <Link
        href="/"
        className="font-mono fixed top-5 left-5 z-20 text-[13px] tracking-[-0.02em] text-[#8b95a1] hover:underline transition-colors"
      >
        ← Home
      </Link>
      <SparklesCore className="fixed inset-0 -z-10 pointer-events-none" background="transparent" particleColor="#4f46e5" particleDensity={40} minSize={1} maxSize={2} speed={1.5} />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
            <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
          </svg>
          <span className="text-xl tracking-[-0.04em] text-[#1a1f26] dark:text-white">ORA</span>
        </div>

        <div className="bg-white dark:bg-[#212832] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[20px] p-10">
          <h1 className="text-[36px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white text-center mb-2">
            Create account
          </h1>
          <p className="text-[18px] leading-normal tracking-[-0.001em] font-normal text-[#8b95a1] text-center mb-8">
            Free forever for solo users
          </p>

          {error && (
            <div className="font-mono bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[13px] tracking-[-0.02em] px-3 py-2 rounded-[8px] mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Your name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="Jane Smith"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Organization / firm name</label>
              <input
                type="text"
                value={form.orgName}
                onChange={(e) => update('orgName', e.target.value)}
                required
                placeholder="Smith CPA"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Work email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                placeholder="jane@smithcpa.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
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
            <OriginButton type="submit" disabled={loading} className={btnCls}>
              {loading ? 'Creating account…' : 'Create account'}
            </OriginButton>
          </form>

          <div className="mt-8 pt-6 border-t border-[#d4d6cf] dark:border-[#3a4550] text-center">
            <span className="font-mono text-[13px] tracking-[-0.02em] text-[#8b95a1]">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
