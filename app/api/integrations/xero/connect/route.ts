import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SCOPE = 'openid profile email accounting.transactions accounting.contacts offline_access';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    state: 'xero-connect',
  });

  const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

  console.log('XERO_CLIENT_ID value:', process.env.XERO_CLIENT_ID);
  console.log('XERO_REDIRECT_URI value:', process.env.XERO_REDIRECT_URI);
  console.log('Full auth URL:', authUrl);

  return NextResponse.redirect(authUrl);
}
