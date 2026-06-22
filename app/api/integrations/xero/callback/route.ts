import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptTokens, XeroTokenSet } from '@/lib/xero';

export async function GET(req: NextRequest) {
  console.log('Xero callback hit - params:', req.url);
  try {
    if (!process.env.XERO_CLIENT_ID) {
      return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
    }

    // Extract userId from state parameter (passed through OAuth flow)
    const state = req.nextUrl.searchParams.get('state') ?? '';
    let userId = state.replace('xero-connect-', '');

    // Fallback to session if state doesn't contain userId
    if (!userId || userId === state) {
      console.log('[xero/callback] No userId in state, falling back to session');
      const session = await auth();
      if (!session?.user) return NextResponse.redirect(new URL('/auth/signin', req.url));
      userId = (session.user as { id: string }).id;
    }

    console.log('[xero/callback] userId:', userId);

    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      console.error('[xero/callback] Missing authorization code. Query params:', req.nextUrl.searchParams.toString());
      throw new Error('Missing authorization code from Xero');
    }

    console.log('[xero/callback] Exchanging code for tokens...');
    console.log('[xero/callback] redirect_uri:', process.env.XERO_REDIRECT_URI);

    // Exchange code for tokens
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
        redirect_uri: process.env.XERO_REDIRECT_URI!,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[xero/callback] Token exchange failed. Status:', tokenRes.status);
      console.error('[xero/callback] Token exchange error body:', errBody);
      throw new Error(`Token exchange failed: ${tokenRes.status} ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    console.log('[xero/callback] Token exchange successful. Has access_token:', !!tokenData.access_token);
    console.log('[xero/callback] Token expires_in:', tokenData.expires_in);

    // Fetch tenant connections directly via Xero API
    const connectionsRes = await fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!connectionsRes.ok) {
      const connErr = await connectionsRes.text();
      console.error('[xero/callback] Connections fetch failed. Status:', connectionsRes.status);
      console.error('[xero/callback] Connections error body:', connErr);
      throw new Error(`Failed to fetch Xero connections: ${connectionsRes.status}`);
    }

    const connections = await connectionsRes.json() as { tenantId: string; tenantName?: string }[];
    console.log('[xero/callback] Connections:', JSON.stringify(connections));

    const tenantId = connections[0]?.tenantId;
    if (!tenantId) {
      console.error('[xero/callback] No tenants found in connections response');
      throw new Error('No Xero tenants found after OAuth');
    }

    console.log('[xero/callback] Using tenantId:', tenantId);

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

    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=connected', req.url),
    );
  } catch (error: any) {
    console.error('Xero callback FATAL error:', error?.message);
    console.error('Xero callback error stack:', error?.stack);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=error&msg=' +
      encodeURIComponent(error?.message || 'unknown'), req.url),
    );
  }
}
