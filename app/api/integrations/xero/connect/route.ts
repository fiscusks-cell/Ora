import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { makeXeroClient } from '@/lib/xero';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.XERO_CLIENT_ID) {
    return NextResponse.json({ error: 'XERO_CLIENT_ID not configured' }, { status: 503 });
  }

  const xero = makeXeroClient();
  const consentUrl = await xero.buildConsentUrl();
  return NextResponse.redirect(consentUrl);
}
