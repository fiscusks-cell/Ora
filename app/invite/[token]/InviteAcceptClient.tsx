'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { AlertCircle, CheckCircle, Clock, UserX } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  AuthLink,
  Banner,
  Field,
  PanelFooter,
  PasswordInput,
  PrimaryButton,
  PrimaryLink,
  SubmitButton,
  TextInput,
} from '@/components/auth/fields';

export type InviteState =
  | 'valid'
  | 'expired'
  | 'invalid'
  | 'already_accepted'
  | 'different_org'
  | 'wrong_user';

interface Props {
  state: InviteState;
  token?: string;
  email?: string;
  orgName?: string;
  role?: string;
  signedInAs?: string;
}

/**
 * The five non-form states share this card. `tone` picks the icon color:
 * attention states take Ember Pulse (the warm accent is for exactly this),
 * success takes the ok state color, the dead link stays muted.
 */
function StatusCard({
  icon: Icon,
  tone,
  title,
  body,
  footer,
}: {
  icon: React.ElementType;
  tone: 'muted' | 'attention' | 'ok';
  title: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'attention' ? 'text-ember-pulse' : 'text-ink-muted';
  return (
    <div className="text-center">
      <Icon className={`mx-auto mb-4 h-10 w-10 ${color}`} aria-hidden="true" />
      <h1 className="font-display text-heading font-bold tracking-[-0.025em] text-ink [text-wrap:balance]">{title}</h1>
      <div className="mb-6 mt-3 text-body text-ink-secondary">{body}</div>
      {footer}
    </div>
  );
}

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-medium text-ink">{children}</strong>
);

export default function InviteAcceptClient({
  state,
  token,
  email,
  orgName,
  role,
}: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'expired') {
          setError('This invitation has expired. Ask your admin to resend it.');
        } else if (data.error === 'already_accepted') {
          setError('This invitation has already been accepted. Try signing in.');
        } else if (data.error === 'different_org') {
          setError(
            'You already have an ORA account linked to a different workspace. Use a separate email address to join this one.',
          );
        } else if (data.error === 'invalid') {
          setError('This invitation link is no longer valid.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      // Account created — sign in with the credentials just set
      const result = await signIn('credentials', {
        email: data.email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          'Account created, but sign-in failed. Go to the sign-in page and use your new password.',
        );
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (state === 'invalid') {
    return (
      <AuthShell>
        <StatusCard
          icon={AlertCircle}
          tone="muted"
          title="Invalid invitation link"
          body="This link doesn't exist or has already been used. Ask your admin to send you a new invitation."
          footer={<AuthLink href="/auth/signin">Sign in instead →</AuthLink>}
        />
      </AuthShell>
    );
  }

  if (state === 'expired') {
    return (
      <AuthShell>
        <StatusCard
          icon={Clock}
          tone="attention"
          title="Invitation expired"
          body="This invite link was valid for 7 days and has now expired. Ask your admin to resend it — your new link will be valid immediately."
          footer={<AuthLink href="/auth/signin">Sign in instead →</AuthLink>}
        />
      </AuthShell>
    );
  }

  if (state === 'already_accepted') {
    return (
      <AuthShell>
        <StatusCard
          icon={CheckCircle}
          tone="ok"
          title="Already a member"
          body={
            <>
              An account for <Strong>{email}</Strong> already exists in <Strong>{orgName}</Strong>. Sign in to
              continue.
            </>
          }
          footer={<PrimaryLink href="/auth/signin">Sign in</PrimaryLink>}
        />
      </AuthShell>
    );
  }

  if (state === 'different_org') {
    return (
      <AuthShell>
        <StatusCard
          icon={UserX}
          tone="attention"
          title="Account conflict"
          body={
            <>
              <Strong>{email}</Strong> is already registered with a different ORA workspace. Accepting this
              invite would move you out of that workspace, which isn&apos;t allowed.
              <br />
              <br />
              To join <Strong>{orgName}</Strong>, register with a different email address and ask your admin to
              send a new invitation to that address.
            </>
          }
          footer={<AuthLink href="/auth/signin">Sign in to your existing account →</AuthLink>}
        />
      </AuthShell>
    );
  }

  if (state === 'wrong_user') {
    // Signed in as someone else: offer a sign-out that returns to this invite.
    return (
      <AuthShell>
        <StatusCard
          icon={AlertCircle}
          tone="attention"
          title="Wrong account"
          body={
            <>
              This invitation is for <Strong>{email}</Strong>.
              <br />
              <br />
              Sign out first, then open this link again to accept the invitation with the correct account.
            </>
          }
          footer={
            <>
              {error && <Banner tone="error">{error}</Banner>}
              <PrimaryButton
                onClick={async () => {
                  setSigningOut(true);
                  setError('');
                  try {
                    await signOut({ callbackUrl: `/invite/${token}` });
                  } catch {
                    setError('Sign-out failed. Please try again.');
                  } finally {
                    setSigningOut(false);
                  }
                }}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out and accept'}
              </PrimaryButton>
            </>
          }
        />
      </AuthShell>
    );
  }

  // 'valid' — join form
  const roleLabel = role === 'OWNER' ? 'Owner' : role === 'ADMIN' ? 'Admin' : 'Member';

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <h1 className="font-display text-display-sm font-bold tracking-[-0.025em] text-ink [text-wrap:balance]">Join {orgName}</h1>
        <p className="mt-2 text-body-lg text-ink-secondary">
          You&apos;ve been invited as a <Strong>{roleLabel}</Strong>. Set up your account to continue.
        </p>
      </div>

      {error && <Banner tone="error">{error}</Banner>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email">
          <TextInput type="email" value={email} disabled readOnly />
        </Field>

        <Field label="Full name" required>
          <TextInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            autoComplete="name"
            placeholder="Your name"
          />
        </Field>

        <Field label="Password" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>

        <SubmitButton disabled={!name.trim() || password.length < 8 || loading}>
          {loading ? 'Creating account…' : 'Join workspace'}
        </SubmitButton>
      </form>

      <PanelFooter>
        Already have an account? <AuthLink href="/auth/signin">Sign in</AuthLink>
      </PanelFooter>
    </AuthShell>
  );
}
