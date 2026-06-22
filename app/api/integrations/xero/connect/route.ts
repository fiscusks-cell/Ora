import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  if (!process.env.XERO_CLIENT_ID || !process.env.XERO_REDIRECT_URI) {
    return NextResponse.json({ error: 'Xero not configured' }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id: process.env.XERO_CLIENT_ID,
    scope: 'openid profile email accounting.invoices accounting.contacts accounting.attachments offline_access',
    response_type: 'code',
    redirect_uri: process.env.XERO_REDIRECT_URI,
    state: `xero-connect-${userId}`,
  });

  const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

  console.log('[xero/connect] authUrl:', authUrl);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('xero_oauth_user', userId, {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
