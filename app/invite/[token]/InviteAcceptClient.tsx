'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, CheckCircle, Clock, UserX } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import { AuthVideoBackground } from '@/components/auth/auth-video-background';

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

const inputCls =
  'w-full bg-[#f7f7f5] dark:bg-[#1a1f26] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[8px] px-3 py-2.5 text-sm text-[#1a1f26] dark:text-white placeholder-[#8b95a1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const labelCls = 'text-[13px] tracking-[-0.02em] text-[#8b95a1] block mb-2';

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
      <span className="text-xl tracking-[-0.04em] text-[#1a1f26] dark:text-white">ORA</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ora-fade min-h-screen flex items-center justify-center px-4">
      <AuthVideoBackground />
      <div className="relative z-10 w-full max-w-sm">
        <OraLogo />
        <div className="relative z-10 bg-white dark:bg-[#212832] border border-[#d4d6cf] dark:border-[#3a4550] rounded-[20px] p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  iconColor,
  title,
  body,
  footer,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <Icon className={`w-10 h-10 mx-auto mb-4 ${iconColor}`} />
      <h1 className="text-[22px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white mb-3">
        {title}
      </h1>
      <div className="text-[14px] leading-relaxed text-[#8b95a1] mb-6">{body}</div>
      {footer}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[13px] tracking-[-0.02em] px-3 py-2.5 rounded-[8px] mb-5 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      {message}
    </div>
  );
}

export default function InviteAcceptClient({
  state,
  token,
  email,
  orgName,
  role,
}: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <Shell>
        <StatusCard
          icon={AlertCircle}
          iconColor="text-[#8b95a1]"
          title="Invalid invitation link"
          body="This link doesn't exist or has already been used. Ask your admin to send you a new invitation."
          footer={
            <Link
              href="/auth/signin"
              className="text-[13px] tracking-[-0.02em] text-indigo-400 hover:underline"
            >
              Sign in instead →
            </Link>
          }
        />
      </Shell>
    );
  }

  if (state === 'expired') {
    return (
      <Shell>
        <StatusCard
          icon={Clock}
          iconColor="text-amber-400"
          title="Invitation expired"
          body="This invite link was valid for 7 days and has now expired. Ask your admin to resend it — your new link will be valid immediately."
          footer={
            <Link
              href="/auth/signin"
              className="text-[13px] tracking-[-0.02em] text-indigo-400 hover:underline"
            >
              Sign in instead →
            </Link>
          }
        />
      </Shell>
    );
  }

  if (state === 'already_accepted') {
    return (
      <Shell>
        <StatusCard
          icon={CheckCircle}
          iconColor="text-emerald-400"
          title="Already a member"
          body={
            <>
              An account for <strong className="text-[#1a1f26] dark:text-white">{email}</strong>{' '}
              already exists in{' '}
              <strong className="text-[#1a1f26] dark:text-white">{orgName}</strong>. Sign in to
              continue.
            </>
          }
          footer={
            <Link
              href="/auth/signin"
              className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors"
            >
              Sign in
            </Link>
          }
        />
      </Shell>
    );
  }

  if (state === 'different_org') {
    return (
      <Shell>
        <StatusCard
          icon={UserX}
          iconColor="text-amber-400"
          title="Account conflict"
          body={
            <>
              <strong className="text-[#1a1f26] dark:text-white">{email}</strong> is already
              registered with a different ORA workspace. Accepting this invite would move you out of
              that workspace, which isn&apos;t allowed.
              <br />
              <br />
              To join <strong className="text-[#1a1f26] dark:text-white">{orgName}</strong>,
              register with a different email address and ask your admin to send a new invitation to
              that address.
            </>
          }
          footer={
            <Link
              href="/auth/signin"
              className="text-[13px] tracking-[-0.02em] text-indigo-400 hover:underline"
            >
              Sign in to your existing account →
            </Link>
          }
        />
      </Shell>
    );
  }

  if (state === 'wrong_user') {
    return (
      <Shell>
        <StatusCard
          icon={AlertCircle}
          iconColor="text-amber-400"
          title="Wrong account"
          body={
            <>
              This invitation is for{' '}
              <strong className="text-[#1a1f26] dark:text-white">{email}</strong>.
              <br />
              <br />
              Sign out first, then open this link again to accept the invitation with the correct
              account.
            </>
          }
          footer={
            <>
              {error && <ErrorBanner message={error} />}
              <OriginButton
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors"
              >
                {signingOut ? 'Signing out…' : 'Sign out and accept'}
              </OriginButton>
            </>
          }
        />
      </Shell>
    );
  }

  // 'valid' — join form
  const roleLabel = role === 'OWNER' ? 'Owner' : role === 'ADMIN' ? 'Admin' : 'Member';

  return (
    <Shell>
      <h1 className="text-[28px] leading-tight tracking-[-0.022em] font-normal text-[#1a1f26] dark:text-white text-center mb-2">
        Join {orgName}
      </h1>
      <p className="text-[14px] text-[#8b95a1] text-center mb-8">
        You&apos;ve been invited as a{' '}
        <span className="font-medium text-[#1a1f26] dark:text-white">{roleLabel}</span>. Set up
        your account to continue.
      </p>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={email}
            disabled
            className={`${inputCls} opacity-60 cursor-not-allowed`}
          />
        </div>

        <div>
          <label className={labelCls}>
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
            autoFocus
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
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

        <OriginButton
          type="submit"
          disabled={!name.trim() || password.length < 8 || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] tracking-[-0.02em] py-2.5 rounded-[8px] transition-colors shadow-none"
        >
          {loading ? 'Creating account…' : 'Join workspace'}
        </OriginButton>
      </form>

      <div className="mt-8 pt-6 border-t border-[#d4d6cf] dark:border-[#3a4550] text-center">
        <span className="text-[13px] tracking-[-0.02em] text-[#8b95a1]">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </span>
      </div>
    </Shell>
  );
}
