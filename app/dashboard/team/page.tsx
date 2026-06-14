'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Shield, ShieldCheck, User } from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

type MemberRole = 'MEMBER' | 'ADMIN' | 'OWNER';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: MemberRole;
  avatarUrl?: string | null;
  hoursThisMonth?: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<MemberRole, string> = {
  MEMBER: 'bg-slate-800 text-slate-400',
  ADMIN: 'bg-indigo-900/60 text-indigo-400',
  OWNER: 'bg-amber-900/60 text-amber-400',
};

const ROLE_ICONS: Record<MemberRole, React.ReactNode> = {
  MEMBER: <User className="w-3 h-3" />,
  ADMIN: <Shield className="w-3 h-3" />,
  OWNER: <ShieldCheck className="w-3 h-3" />,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function avatarInitial(m: Member): string {
  if (m.name) return m.name.charAt(0).toUpperCase();
  return m.email.charAt(0).toUpperCase();
}

// ─── page ────────────────────────────────────────────────────────────────────

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

  // ── fetch ────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // ── invite ───────────────────────────────────────────────────────────────

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

  // ── role change ──────────────────────────────────────────────────────────

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

  // ── remove ───────────────────────────────────────────────────────────────

  const handleRemove = async (m: Member) => {
    if (!confirm(`Remove ${m.name ?? m.email} from the team?`)) return;
    const res = await fetch(`/api/team/${m.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers((prev) => prev.filter((mem) => mem.id !== m.id));
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Team</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage members and permissions</p>
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
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Access error */}
      {accessError && (
        <div className="text-center py-20 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <p className="text-lg font-semibold text-white mb-2">Access restricted</p>
          <p className="text-sm">{accessError}</p>
        </div>
      )}

      {/* Members table */}
      {!accessError && (
        <>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center text-slate-500 py-16 bg-slate-900 border border-slate-800 rounded-xl">
              No team members yet. Invite someone to collaborate.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    {members.some((m) => m.hoursThisMonth != null) && (
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Hours (month)
                      </th>
                    )}
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
                            {avatarInitial(m)}
                          </div>
                          <span className="font-medium text-white truncate max-w-[140px]">
                            {m.name ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-400 max-w-[200px]">
                        <span className="truncate block">{m.email}</span>
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded ${
                            ROLE_STYLES[m.role]
                          }`}
                        >
                          {ROLE_ICONS[m.role]}
                          {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Hours (optional) */}
                      {members.some((mem) => mem.hoursThisMonth != null) && (
                        <td className="px-4 py-3 text-slate-300 tabular-nums font-mono">
                          {m.hoursThisMonth != null ? `${m.hoursThisMonth.toFixed(1)}h` : '—'}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {m.role !== 'OWNER' && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleRoleChange(m.id, m.role)}
                              className="text-xs text-slate-500 hover:text-indigo-300 border border-slate-700 hover:border-indigo-600 px-2 py-1 rounded transition-colors"
                            >
                              {m.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleRemove(m)}
                              className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Invite Dialog ────────────────────────────────────────────── */}
      {showInvite && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInvite(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
              <button
                onClick={() => setShowInvite(false)}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback */}
            {inviteMsg && (
              <div
                className={`text-sm px-3 py-2.5 rounded-lg mb-4 border ${
                  inviteOk
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-red-950 text-red-300 border-red-800'
                }`}
              >
                {inviteMsg}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Email address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@firm.com"
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MEMBER">Member — track time only</option>
                  <option value="ADMIN">Admin — manage team &amp; approve periods</option>
                  <option value="OWNER">Owner — full access</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
