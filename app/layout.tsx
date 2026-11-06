import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

// Both faces are self-hosted so a build never fetches from Google Fonts:
// next/font/google's build-time fetch fails intermittently when Google serves
// extensionless font URLs (vercel/next.js#99114, fixed only from 16.4.3).
// Body face: Inter 4.1 (SIL OFL 1.1), the single variable woff2 from the
// official release, on its full weight axis. Licence: public/fonts/Inter-OFL.txt.
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter',
});
// Display face: Akt (SIL OFL 1.1), a variable font; next/font/google's
// catalogue does not list it anyway. The served file is the woff2 on the full
// weight axis; the TTF beside it in app/fonts is the source only and is not
// bundled. Licence: public/fonts/Akt-OFL.txt. globals.css exposes the face as
// `font-display`.
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