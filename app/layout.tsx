import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter' });
// Display face. The design spec names Esbuild, a licensed font, and lists Sora
// as its substitute; Sora is a variable Google font, so no weight list is
// needed. globals.css exposes it as `font-display`. To adopt Esbuild later,
// replace this loader with next/font/local on the same variable name.
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });

export const metadata: Metadata = {
  title: 'ORA — Time, tracked. Invoices, done.',
  description:
    'Time tracking for accounting teams. Track time, approve billing periods, and publish invoices to QuickBooks and Xero automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}