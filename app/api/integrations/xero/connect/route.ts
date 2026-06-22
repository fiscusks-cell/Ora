import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getXeroClient } from '@/lib/xero-client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  if (!process.env.XERO_CLIENT_ID) {
    return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
  }

  const xero = getXeroClient();
  const consentUrl = await xero.buildConsentUrl();

  console.log('[xero/connect] userId:', userId);
  console.log('[xero/connect] consentUrl:', consentUrl);

  const response = NextResponse.redirect(consentUrl);
  response.cookies.set('xero_oauth_user', userId, {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
