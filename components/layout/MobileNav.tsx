'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { OraLogo } from '@/components/layout/OraLogo';

interface MobileNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    organizationName: string;
  };
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-60 p-0 bg-slate-900 border-r border-slate-800 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <OraLogo />
        </div>
        {/* Nav — closes sheet on link click */}
        <div className="flex flex-col flex-1 overflow-hidden" onClick={() => setOpen(false)}>
          <DashboardNav user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
