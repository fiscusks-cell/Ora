'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

export default function SignUpPage() {
  const router = useRouter();
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

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      // Account was created — just send them to sign in
      window.location.href = '/auth/signin?registered=1';
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Link href="/" className="fixed top-4 left-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Home
      </Link>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3730A3" strokeWidth="2.5" />
            <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="1.5" fill="#6366F1" />
          </svg>
          <span className="text-2xl font-black tracking-tight text-white">ORA</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h1 className="text-xl font-bold mb-1 text-center">Create your account</h1>
          <p className="text-sm text-slate-400 text-center mb-6">Free forever for solo users</p>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Your name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Organization / firm name</label>
              <input
                type="text"
                value={form.orgName}
                onChange={(e) => update('orgName', e.target.value)}
                required
                placeholder="Smith CPA"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Work email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                placeholder="jane@smithcpa.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <OriginButton
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </OriginButton>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
