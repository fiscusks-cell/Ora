'use client';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { AuthLink, Banner, Field, PanelFooter, SubmitButton, TextInput } from '@/components/auth/fields';

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
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-ok-line bg-ok-soft">
            <CheckCircle2 className="h-6 w-6 text-ok" aria-hidden="true" />
          </div>
          <h2 className="font-display text-heading font-semibold text-ink">Check your email</h2>
          <p className="mt-3 text-body-lg text-ink-secondary">
            If an account exists for <span className="text-ink">{email}</span>, we sent a reset link. Check your inbox and spam folder.
          </p>
          <p className="mt-2 text-caption text-ink-muted">The link expires in 1 hour.</p>
          <div className="mt-8">
            <AuthLink href="/auth/signin" className="text-ink-secondary hover:text-ink">
              Back to sign in
            </AuthLink>
          </div>
        </div>
      ) : (
        <>
          <AuthHeading title="Forgot password?" subtitle="We'll send you a reset link." />

          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="you@firm.com"
              />
            </Field>
            <SubmitButton disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</SubmitButton>
          </form>

          <PanelFooter>
            <AuthLink href="/auth/signin" className="text-ink-secondary hover:text-ink">
              Back to sign in
            </AuthLink>
          </PanelFooter>
        </>
      )}
    </AuthShell>
  );
}
