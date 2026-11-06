import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

// The one face: Akt (SIL OFL 1.1), a variable font, self-hosted so a build
// never fetches from Google Fonts (next/font/google's build-time fetch fails
// intermittently on extensionless font URLs, vercel/next.js#99114). The served
// file is the woff2 on the full weight axis; the TTF beside it in app/fonts is
// the source only and is not bundled. Licence: public/fonts/Akt-OFL.txt.
// globals.css maps it to both `font-sans` (all UI text) and `font-display`.
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
    <html lang="en" className={akt.variable} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}