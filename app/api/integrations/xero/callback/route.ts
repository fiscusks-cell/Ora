import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptTokens, XeroTokenSet } from '@/lib/xero';

export async function GET(req: NextRequest) {
  console.log('[xero/callback] hit - url:', req.url);
  try {
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET || !process.env.XERO_REDIRECT_URI) {
      return NextResponse.json({ error: 'Xero not configured' }, { status: 503 });
    }

    // Get userId from cookie (set during connect) or state param
    let userId = req.cookies.get('xero_oauth_user')?.value ?? '';

    if (!userId) {
      const state = req.nextUrl.searchParams.get('state') ?? '';
      userId = state.replace('xero-connect-', '');
    }

    if (!userId) {
      console.log('[xero/callback] No userId in cookie or state, falling back to session');
      const session = await auth();
      if (!session?.user) return NextResponse.redirect(new URL('/auth/signin', req.url));
      userId = (session.user as { id: string }).id;
    }

    console.log('[xero/callback] userId:', userId);

    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      console.error('[xero/callback] Missing code. Params:', req.nextUrl.searchParams.toString());
      throw new Error('Missing authorization code from Xero');
    }

    // Exchange code for tokens using Basic auth
    console.log('[xero/callback] Exchanging code for tokens...');
    console.log('[xero/callback] redirect_uri:', process.env.XERO_REDIRECT_URI);

    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[xero/callback] Token exchange failed:', tokenRes.status, errBody);
      throw new Error(`Token exchange failed: ${tokenRes.status} ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    console.log('[xero/callback] Token exchange OK. Has access_token:', !!tokenData.access_token);

    // Fetch tenant connections
    const connectionsRes = await fetch('https://api.xero.com/connections', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!connectionsRes.ok) {
      const connErr = await connectionsRes.text();
      console.error('[xero/callback] Connections failed:', connectionsRes.status, connErr);
      throw new Error(`Failed to fetch Xero connections: ${connectionsRes.status}`);
    }

    const connections = await connectionsRes.json() as { tenantId: string; tenantName?: string }[];
    console.log('[xero/callback] Connections:', JSON.stringify(connections));

    const tenantId = connections[0]?.tenantId;
    if (!tenantId) throw new Error('No Xero tenants found after OAuth');

    console.log('[xero/callback] tenantId:', tenantId);

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

    console.log('[xero/callback] Successfully connected Xero for user:', userId);

    const response = NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=connected', req.url),
    );
    response.cookies.delete('xero_oauth_user');
    return response;
  } catch (error: any) {
    console.error('[xero/callback] FATAL:', error?.message);
    console.error('[xero/callback] stack:', error?.stack);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=error&msg=' +
      encodeURIComponent(error?.message || 'unknown'), req.url),
    );
  }
}
