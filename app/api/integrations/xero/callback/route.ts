import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { makeXeroClient, encryptTokens, XeroTokenSet } from '@/lib/xero';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.redirect(new URL('/auth/signin', req.url));

    const userId = (session.user as { id: string }).id;

    if (!process.env.XERO_CLIENT_ID) {
      return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
    }

    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      throw new Error('Missing authorization code from Xero');
    }

    const redirectUri =
      process.env.XERO_REDIRECT_URI ??
      `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/integrations/xero/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.XERO_CLIENT_ID!,
        client_secret: process.env.XERO_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[xero/callback] token exchange failed:', errBody);
      throw new Error('Token exchange failed');
    }

    const tokenData = await tokenRes.json();

    // Use XeroClient to fetch tenants
    const xero = makeXeroClient();
    xero.setTokenSet({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      id_token: tokenData.id_token,
      token_type: 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
    });

    await xero.updateTenants();
    const tenantId = xero.tenants[0]?.tenantId;
    if (!tenantId) {
      throw new Error('No Xero tenants found after OAuth');
    }

    const tokens: XeroTokenSet = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      id_token: tokenData.id_token,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        connectedXero: true,
        xeroTenantId: tenantId,
        xeroTokens: encryptTokens(tokens),
      },
    });

    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=connected', req.url),
    );
  } catch (err) {
    console.error('[xero/callback] error:', err);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=error', req.url),
    );
  }
}
