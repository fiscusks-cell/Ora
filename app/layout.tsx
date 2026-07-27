import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono-jetbrains' });
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: 'ORA — Time, tracked. Invoices, done.',
  description:
    'Time tracking for accounting teams. Track time, approve billing periods, and publish invoices to QuickBooks and Xero automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable} ${syne.variable}`} data-theme="dark">
      <body className="font-sans antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
