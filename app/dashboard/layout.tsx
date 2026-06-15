import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { MobileNav } from '@/components/layout/MobileNav';
import { OraLogo } from '@/components/layout/OraLogo';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const sessionUser = session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
  };

  const org = await prisma.organization.findUnique({
    where: { id: sessionUser.organizationId },
  });

  const navUser = {
    name: sessionUser.name || sessionUser.email || 'User',
    email: sessionUser.email || '',
    role: sessionUser.role || 'MEMBER',
    organizationName: org?.name ?? '',
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="p-5 border-b border-slate-800">
          <OraLogo />
        </div>
        <DashboardNav user={navUser} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-slate-900 border-b border-slate-800">
        <MobileNav user={navUser} />
        <OraLogo />
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
