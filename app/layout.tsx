import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter' });
// Display face: Akt (SIL OFL 1.1), a variable font loaded locally because
// next/font/google's catalogue (Next 16.2.9) does not list it. The served file
// is the woff2 on the full weight axis; the TTF beside it in app/fonts is the
// source only and is not bundled. The licence ships at public/fonts/Akt-OFL.txt.
// globals.css exposes the face as `font-display`.
const akt = localFont({
  src: './fonts/Akt-VariableFont_wght.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-akt',
});

export const metadata: Metadata = {
  title: 'ORA — Time, tracked. Invoices, done.',
  description:
    'Time tracking for accounting teams. Track time, approve billing periods, and publish invoices to QuickBooks and Xero automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${akt.variable}`} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}