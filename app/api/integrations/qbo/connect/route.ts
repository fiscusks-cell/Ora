import OAuthClient from 'intuit-oauth';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { makeOAuthClient } from '@/lib/qbo';

export async function GET() {
  // These tokens exist only to publish invoices, which is owner/admin work.
  // The row is per user, so a member could not break anyone else's connection
  // -- but a connection they bind now would start being used the moment they
  // were promoted, sending invoices to whichever tenant they authorized.
  const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
  if (authz instanceof NextResponse) return authz;

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
