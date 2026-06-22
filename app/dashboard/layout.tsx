import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { MobileNav } from '@/components/layout/MobileNav';
import { OraLogo } from '@/components/layout/OraLogo';
import { IdleTimerWarning } from '@/components/timer/idle-warning';
import { fetchRandomPhotos } from '@/lib/unsplash';
import { UnsplashSlideshow } from '@/components/background/unsplash-slideshow';

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

  const photos = await fetchRandomPhotos();

  const navUser = {
    name: sessionUser.name || sessionUser.email || 'User',
    email: sessionUser.email || '',
    role: sessionUser.role || 'MEMBER',
    organizationName: org?.name ?? '',
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar — always dark for brand consistency */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <OraLogo />
        </div>
        <DashboardNav user={navUser} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14" style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)' }}>
        <MobileNav user={navUser} />
        <OraLogo />
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0 relative" style={{ background: 'var(--background)' }}>
        <UnsplashSlideshow photos={photos} />
        {children}
      </main>
      <IdleTimerWarning />
    </div>
  );
}
