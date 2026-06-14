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
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <OraLogo />
        <p className="text-xs text-slate-500 mt-1 pl-10">Time, tracked.</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <DashboardNav user={user} />
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.organizationName}</p>
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
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full px-2 py-1.5 rounded hover:bg-slate-800"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
