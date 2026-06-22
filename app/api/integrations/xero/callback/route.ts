import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getXeroClient } from '@/lib/xero-client';
import { encryptTokens, XeroTokenSet } from '@/lib/xero';

export async function GET(req: NextRequest) {
  console.log('[xero/callback] hit - url:', req.url);
  try {
    if (!process.env.XERO_CLIENT_ID) {
      return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
    }

    // Get userId from cookie set during connect
    let userId = req.cookies.get('xero_oauth_user')?.value ?? '';

    // Fallback to session
    if (!userId) {
      console.log('[xero/callback] No userId in cookie, falling back to session');
      const session = await auth();
      if (!session?.user) return NextResponse.redirect(new URL('/auth/signin', req.url));
      userId = (session.user as { id: string }).id;
    }

    console.log('[xero/callback] userId:', userId);

    // Use xero-node SDK to exchange code for tokens
    const xero = getXeroClient();
    const tokenSet = await xero.apiCallback(req.url);

    console.log('[xero/callback] Token exchange successful. Has access_token:', !!tokenSet.access_token);

    // Get tenant info
    await xero.updateTenants();
    const tenantId = xero.tenants[0]?.tenantId;

    if (!tenantId) {
      console.error('[xero/callback] No tenants found');
      throw new Error('No Xero tenants found after OAuth');
    }

    console.log('[xero/callback] tenantId:', tenantId);
    console.log('[xero/callback] tenantName:', xero.tenants[0]?.tenantName);

    const tokens: XeroTokenSet = {
      access_token: tokenSet.access_token!,
      refresh_token: tokenSet.refresh_token!,
      expires_at: tokenSet.expires_at ? tokenSet.expires_at * 1000 : Date.now() + 1800000,
      id_token: tokenSet.id_token,
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
    console.error('[xero/callback] FATAL error:', error?.message);
    console.error('[xero/callback] error stack:', error?.stack);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&xero=error&msg=' +
      encodeURIComponent(error?.message || 'unknown'), req.url),
    );
  }
}
