import { OraLogo } from './OraLogo';
import { DashboardNav } from './DashboardNav';
import { signOut } from '@/lib/auth';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    organizationName: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-40"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <OraLogo />
        <p className="text-xs mt-1 pl-10" style={{ color: 'var(--sidebar-muted)' }}>Time, tracked.</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <DashboardNav user={user} />
      </div>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-sm shrink-0">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--sidebar-muted)' }}>{user.organizationName}</p>
          </div>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/auth/signin' });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded transition-colors hover:bg-white/10"
            style={{ color: 'var(--sidebar-muted)' }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
