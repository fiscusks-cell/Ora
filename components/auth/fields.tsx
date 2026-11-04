'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

/**
 * Form vocabulary for the auth pages, on the semantic theme utilities.
 * Inputs are 16px so iOS does not zoom on focus; focus is the accent ring.
 */

export const inputCls =
  'w-full rounded-inputs border border-line bg-well px-3 py-2.5 text-body-lg text-ink placeholder:text-ink-secondary transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60';

export function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-body text-ink-secondary">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

/** A password input with its own show/hide toggle. */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={`${inputCls} pr-11 ${props.className ?? ''}`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-buttons p-1.5 text-ink-muted transition-colors hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

export function Banner({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const isError = tone === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mb-6 flex items-start gap-2.5 rounded-[8px] border px-3.5 py-3 text-body ${
        isError ? 'border-danger-line bg-danger-soft text-danger' : 'border-ok-line bg-ok-soft text-ok'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

// The glow is Electric Iris in both themes, so a literal rgba is safe here.
const pill =
  'inline-flex w-full items-center justify-center rounded-buttons bg-accent px-6 py-3 text-body-lg font-medium text-snow transition-[background-color,box-shadow] duration-200 hover:bg-accent-hover hover:shadow-[0_0_0_4px_rgba(86,131,218,0.22),0_8px_24px_rgba(86,131,218,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent disabled:hover:shadow-none';

export function SubmitButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" {...rest} className={`${pill} ${className}`}>
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`${pill} ${className}`}>
      {children}
    </button>
  );
}

export function PrimaryLink({ children, className = '', ...rest }: LinkProps & { children: React.ReactNode; className?: string }) {
  return (
    <Link {...rest} className={`${pill} ${className}`}>
      {children}
    </Link>
  );
}

/** A quiet text link under a form. */
export function AuthLink({ children, className = '', ...rest }: LinkProps & { children: React.ReactNode; className?: string }) {
  return (
    <Link {...rest} className={`text-body text-accent underline-offset-4 transition-colors hover:underline ${className}`}>
      {children}
    </Link>
  );
}

/** The divider + line of secondary navigation at the foot of a panel. */
export function PanelFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 border-t border-line pt-6 text-center text-body text-ink-secondary">{children}</div>;
}
