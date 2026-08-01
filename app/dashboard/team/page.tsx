'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Shield, ShieldCheck, User } from 'lucide-react';
import { DataTable, StatusBadge, Column } from '@/components/ui/data-table';

type MemberRole = 'MEMBER' | 'ADMIN' | 'OWNER';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: MemberRole;
  avatarUrl?: string | null;
  hoursThisMonth?: number;
}

const ROLE_ICONS: Record<MemberRole, React.ReactNode> = {
  MEMBER: <User className="w-3 h-3" />,
  ADMIN: <Shield className="w-3 h-3" />,
  OWNER: <ShieldCheck className="w-3 h-3" />,
};

function avatarInitial(m: Member): string {
  if (m.name) return m.name.charAt(0).toUpperCase();
  return m.email.charAt(0).toUpperCase();
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteOk, setInviteOk] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      if (res.status === 403) {
        setAccessError('Only Owners and Admins can manage team members.');
        return;
      }
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg('');
    setInviteOk(false);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg(`Invite sent to ${inviteEmail}`);
        setInviteOk(true);
        setInviteEmail('');
        await fetchTeam();
        setTimeout(() => setShowInvite(false), 1500);
      } else {
        setInviteMsg(data.error ?? data.message ?? 'Failed to send invite');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (id: string, currentRole: MemberRole) => {
    if (currentRole === 'OWNER') return;
    const newRole: MemberRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const res = await fetch(`/api/team/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    }
  };

  const handleRemove = async (m: Member) => {
    if (!confirm(`Remove ${m.name ?? m.email} from the team?`)) return;
    const res = await fetch(`/api/team/${m.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers((prev) => prev.filter((mem) => mem.id !== m.id));
    }
  };

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 select-none" style={{ background: 'var(--accent)' }}>
            {avatarInitial(m)}
          </div>
          <span className="font-medium truncate max-w-[140px]" style={{ color: 'var(--text)' }}>
            {m.name ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (m) => (
        <span className="truncate block max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{m.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => (
        <span
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{
            background: m.role === 'OWNER'
              ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
              : m.role === 'ADMIN'
                ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                : 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
            color: m.role === 'OWNER' ? '#f59e0b' : m.role === 'ADMIN' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {ROLE_ICONS[m.role]}
          {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'hoursThisMonth',
      header: 'Hours (month)',
      render: (m) => (
        <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {m.hoursThisMonth != null ? `${m.hoursThisMonth.toFixed(1)}h` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge active={true} />,
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal" style={{ color: 'var(--text)' }}>Team Members</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage members and permissions</p>
        </div>
        {!accessError && (
          <button
            onClick={() => {
              setShowInvite(true);
              setInviteMsg('');
              setInviteOk(false);
              setInviteEmail('');
              setInviteRole('MEMBER');
            }}
            className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {accessError ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <ShieldCheck className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg mb-2" style={{ color: 'var(--text)' }}>Access restricted</p>
          <p className="text-sm">{accessError}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={members}
          searchKeys={['name', 'email']}
          searchPlaceholder="Search by name or email..."
          loading={loading}
          emptyMessage="No team members yet. Invite someone to collaborate."
          actions={(m) =>
            m.role !== 'OWNER' ? (
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => handleRoleChange(m.id, m.role)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  {m.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                </button>
                <button
                  onClick={() => handleRemove(m)}
                  className="p-1.5 transition-colors rounded hover:text-red-400"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null
          }
        />
      )}

      {showInvite && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}
        >
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-normal" style={{ color: 'var(--text)' }}>Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteMsg && (
              <div className="text-sm px-3 py-2.5 rounded-lg mb-4" style={{
                background: inviteOk ? 'var(--success-bg)' : 'var(--error-bg)',
                color: inviteOk ? 'var(--success)' : 'var(--error)',
                border: `1px solid ${inviteOk ? 'var(--success-border)' : 'var(--error-border)'}`,
              }}>
                {inviteMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email address <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@firm.com"
                  autoFocus
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                >
                  <option value="MEMBER">Member — track time only</option>
                  <option value="ADMIN">Admin — manage team &amp; approve periods</option>
                  <option value="OWNER">Owner — full access</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-lg text-sm transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 text-white py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
