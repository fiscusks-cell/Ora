import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SCOPE = 'openid profile email accounting.invoices accounting.contacts accounting.attachments offline_access';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const clientId = process.env.XERO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
  }

  const redirectUri = process.env.XERO_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json({ error: 'XERO_REDIRECT_URI not configured' }, { status: 503 });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPE,
    state: `xero-connect-${userId}`,
  });

  const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

  console.log('[xero/connect] userId:', userId);
  console.log('[xero/connect] redirect_uri:', redirectUri);

  return NextResponse.redirect(authUrl);
}
