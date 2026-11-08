import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

// Both faces are self-hosted so a build never fetches from Google Fonts
// (next/font/google's build-time fetch fails intermittently on extensionless
// font URLs, vercel/next.js#99114). Licences ship in public/fonts.
//
// Body face: Lato 2.015 (SIL OFL 1.1) from latofonts.com, its LatoLatin cut
// (the publisher's Latin subset), converted to woff2 from the TTFs kept in the
// ignored fonts-src/. 400, 500 and 600 are the weights the body uses. Every
// digit has the same advance, so duration columns and the live counter hold
// steady with or without `tabular-nums`. globals.css maps it to `font-sans`.
const lato = localFont({
  src: [
    { path: './fonts/LatoLatin-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/LatoLatin-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/LatoLatin-Semibold.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-lato',
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
    <html lang="en" className={`${lato.variable} ${akt.variable}`} data-theme="light">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}