import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  // NextAuth v5 uses 'authjs.session-token'; v4 used 'next-auth.session-token'.
  // Try both so the middleware works regardless of which cookie name is present.
  const secureCookiePrefix = req.nextUrl.protocol === 'https:' ? '__Secure-' : '';
  const v5CookieName = `${secureCookiePrefix}authjs.session-token`;
  const v4CookieName = `${secureCookiePrefix}next-auth.session-token`;

  let token = await getToken({ req, secret, cookieName: v5CookieName });
  if (!token) {
    token = await getToken({ req, secret, cookieName: v4CookieName });
  }

  if (!token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth|webhooks).*)'],
};
