import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';

export async function GET(req: NextRequest) {
  // These tokens exist only to publish invoices, which is owner/admin work.
  // The row is per user, so a member could not break anyone else's connection
  // -- but a connection they bind now would start being used the moment they
  // were promoted, sending invoices to whichever tenant they authorized.
  const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
  if (authz instanceof NextResponse) return authz;
  const { userId } = authz;

  if (!process.env.XERO_CLIENT_ID || !process.env.XERO_REDIRECT_URI) {
    return NextResponse.json({ error: 'Xero not configured' }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id: process.env.XERO_CLIENT_ID,
    scope: 'openid profile email offline_access accounting.invoices accounting.invoices.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read',
    response_type: 'code',
    redirect_uri: process.env.XERO_REDIRECT_URI,
    state: `xero-connect-${userId}`,
  });

  const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

  console.log('[xero/connect] redirect_uri:', process.env.XERO_REDIRECT_URI);
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
