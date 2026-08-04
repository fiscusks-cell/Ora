import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ORA — Time, tracked. Invoices, done.',
  description:
    'Time tracking for accounting teams. Track time, approve billing periods, and publish invoices to QuickBooks and Xero automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}