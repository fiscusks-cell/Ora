'use client';

import { ShieldAlert } from 'lucide-react';

/**
 * Shown when a member reaches an owner/admin page by URL.
 *
 * proxy.ts only checks that a session exists, never the role, so hiding the
 * sidebar link is not enough — the page itself has to handle arriving members.
 */
export function AdminOnlyNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 md:p-8">
      <div
        className="rounded-xl p-12 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <ShieldAlert className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </div>
  );
}
