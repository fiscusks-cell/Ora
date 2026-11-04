'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CheckCircle2 } from 'lucide-react';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { AuthLink, Banner, Field, PanelFooter, PasswordInput, SubmitButton } from '@/components/auth/fields';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="py-2 text-center">
        <p className="mb-6 text-body text-danger">Invalid reset link — no token found.</p>
        <AuthLink href="/auth/forgot-password" className="text-ink-secondary hover:text-ink">
          Request a new link
        </AuthLink>
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
      <div className="py-2 text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-ok-line bg-ok-soft">
          <CheckCircle2 className="h-6 w-6 text-ok" aria-hidden="true" />
        </div>
        <h2 className="font-display text-heading font-semibold text-ink">Password reset</h2>
        <p className="mt-3 text-body text-ink-secondary">Redirecting you to sign in…</p>
      </div>
    );
  }

  const hints = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { ok: /[0-9]/.test(password), label: 'One number' },
    { ok: password.length > 0 && password === confirm, label: 'Passwords match' },
  ];

  return (
    <>
      <AuthHeading title="Set new password" subtitle="Choose a strong password for your account." />

      {error && <Banner tone="error">{error}</Banner>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="New password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
          />
        </Field>
        <Field label="Confirm password">
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Repeat password"
          />
        </Field>

        <ul className="space-y-1.5 pl-1" aria-live="polite">
          {hints.map(({ ok, label }) => (
            <li key={label} className={`flex items-center gap-2 text-caption ${ok ? 'text-ok' : 'text-ink-secondary'}`}>
              {ok ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className="inline-block h-1 w-1 rounded-full bg-current" aria-hidden="true" />
              )}
              {label}
            </li>
          ))}
        </ul>

        <SubmitButton disabled={loading}>{loading ? 'Saving…' : 'Reset password'}</SubmitButton>
      </form>

      <PanelFooter>
        <AuthLink href="/auth/signin" className="text-ink-secondary hover:text-ink">
          Back to sign in
        </AuthLink>
      </PanelFooter>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
