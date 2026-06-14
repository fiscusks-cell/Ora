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

    const xero = makeXeroClient();
    const tokenSet = await xero.apiCallback(req.url);

    // fetch tenants to get the active tenant ID
    await xero.updateTenants();
    const tenantId = xero.tenants[0]?.tenantId;
    if (!tenantId) {
      throw new Error('No Xero tenants found after OAuth');
    }

    const tokens: XeroTokenSet = {
      access_token: tokenSet.access_token!,
      refresh_token: tokenSet.refresh_token!,
      expires_at: (tokenSet.expires_at as number) * 1000, // convert to ms
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
