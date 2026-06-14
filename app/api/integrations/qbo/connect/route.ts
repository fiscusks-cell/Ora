import OAuthClient from 'intuit-oauth';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { makeOAuthClient } from '@/lib/qbo';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.INTUIT_CLIENT_ID) {
    return NextResponse.json({ error: 'INTUIT_CLIENT_ID not configured' }, { status: 503 });
  }

  const client = makeOAuthClient();
  const authUri = client.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: 'qbo-connect',
  });

  return NextResponse.redirect(authUri);
}
