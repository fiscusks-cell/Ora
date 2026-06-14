import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { makeOAuthClient, encryptTokens, QBOTokens } from '@/lib/qbo';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.redirect(new URL('/auth/signin', req.url));

    const userId = (session.user as { id: string }).id;

    if (!process.env.INTUIT_CLIENT_ID) {
      return NextResponse.json({ error: 'INTUIT_CLIENT_ID not configured' }, { status: 503 });
    }

    const client = makeOAuthClient();
    const tokenResponse = await client.createToken(req.url);
    const raw = tokenResponse.getJson() as Record<string, unknown>;

    const realmId = req.nextUrl.searchParams.get('realmId') ?? (raw.realmId as string);

    const tokens: QBOTokens = {
      access_token: raw.access_token as string,
      refresh_token: raw.refresh_token as string,
      expires_at: Date.now() + (raw.expires_in as number) * 1000,
      x_refresh_token_expires_in: raw.x_refresh_token_expires_in as number,
      realmId,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        connectedQBO: true,
        qboRealmId: realmId,
        qboTokens: encryptTokens(tokens),
      },
    });

    return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&qbo=connected', req.url));
  } catch (err) {
    console.error('[qbo/callback] error:', err);
    return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&qbo=error', req.url));
  }
}
