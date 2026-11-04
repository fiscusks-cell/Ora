'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { AuthLink, Banner, Field, PanelFooter, PasswordInput, SubmitButton, TextInput } from '@/components/auth/fields';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', orgName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    // Both full navigations, arrived at by debugging: a registered account whose
    // auto sign-in fails lands on sign-in with the banner, never on an error here.
    if (!result || result.error) {
      window.location.href = '/auth/signin?registered=1';
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <AuthShell>
      <AuthHeading title="Create account" subtitle="Free forever for solo users" />

      {error && <Banner tone="error">{error}</Banner>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Your name">
          <TextInput
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            autoComplete="name"
            placeholder="Jane Smith"
          />
        </Field>
        <Field label="Organization / firm name">
          <TextInput
            type="text"
            value={form.orgName}
            onChange={(e) => update('orgName', e.target.value)}
            required
            autoComplete="organization"
            placeholder="Smith CPA"
          />
        </Field>
        <Field label="Work email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            autoComplete="email"
            placeholder="jane@smithcpa.com"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min 8 characters"
          />
        </Field>
        <SubmitButton disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</SubmitButton>
      </form>

      <PanelFooter>
        Already have an account? <AuthLink href="/auth/signin">Sign in</AuthLink>
      </PanelFooter>
    </AuthShell>
  );
}
