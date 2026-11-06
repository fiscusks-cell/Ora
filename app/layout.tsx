import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

// Both faces are self-hosted so a build never fetches from Google Fonts
// (next/font/google's build-time fetch fails intermittently on extensionless
// font URLs, vercel/next.js#99114). Licences ship in public/fonts.
//
// Body face: Barlow (SIL OFL 1.1), static weights from Google's font
// repository, converted to woff2. 400 and 500 carry the UI; 600 is shipped
// because a few body elements use font-semibold. It has tnum, so
// `tabular-nums` holds duration columns and the live counter steady.
// globals.css maps it to `font-sans`.
const barlow = localFont({
  src: [
    { path: './fonts/Barlow-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Barlow-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Barlow-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-barlow',
});

// Display face: Akt (SIL OFL 1.1), a variable font on its full weight axis;
// the TTF beside it in app/fonts is the source only and is not bundled.
// globals.css maps it to `font-display`.
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
    <html lang="en" className={`${barlow.variable} ${akt.variable}`} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}