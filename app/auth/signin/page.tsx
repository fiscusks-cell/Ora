'use client';
import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { AuthLink, Banner, Field, PanelFooter, PasswordInput, SubmitButton, TextInput } from '@/components/auth/fields';

function SignInForm() {
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
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (!result || result.error) {
      setError('Invalid email or password');
    } else {
      // A full navigation, not a router push: arrived at by debugging, keep it.
      window.location.href = '/dashboard';
    }
  }

  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to your ORA workspace" />

      {justRegistered && !error && <Banner tone="success">Account created — sign in to continue.</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@firm.com"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        <div className="-mt-1 flex justify-end">
          <AuthLink href="/auth/forgot-password" className="text-ink-secondary hover:text-ink">
            Forgot password?
          </AuthLink>
        </div>
        <SubmitButton disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</SubmitButton>
      </form>

      <PanelFooter>
        No account? <AuthLink href="/auth/signup">Create one free</AuthLink>
      </PanelFooter>
    </>
  );
}

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
