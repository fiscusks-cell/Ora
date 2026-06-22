'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Clock, FolderKanban, Building2,
  BarChart3, Users, Settings, PieChart, FileText, LogOut, Sun, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface NavUser {
  name: string;
  email: string;
  role: string;
  organizationName: string;
}

interface DashboardNavProps {
  user: NavUser;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/timer', label: 'Timer', icon: Clock },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
  { href: '/dashboard/periods', label: 'Reports & Periods', icon: BarChart3 },
  { href: '/dashboard/reports', label: 'Reports', icon: PieChart },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
];

const adminNavItems = [
  { href: '/dashboard/team', label: 'Team', icon: Users },
];

const bottomNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN';

  const allItems = [
    ...navItems,
    ...(isAdmin ? adminNavItems : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {allItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'hover:bg-white/5'
              )}
              style={{
                background: active ? 'var(--sidebar-active)' : undefined,
                color: active ? '#fff' : 'var(--sidebar-muted)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'text-white' : 'hover:bg-white/5'
              )}
              style={{
                background: active ? 'var(--sidebar-active)' : undefined,
                color: active ? '#fff' : 'var(--sidebar-muted)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: 'var(--sidebar-muted)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: 'var(--sidebar-active)' }}>
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--sidebar-muted)' }}>{user.organizationName}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--sidebar-muted)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
