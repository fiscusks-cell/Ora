import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // These tokens exist only to publish invoices, which is owner/admin work.
    // The row is per user, so a member could not break anyone else's connection
    // -- but a connection they bind now would start being used the moment they
    // were promoted, sending invoices to whichever tenant they authorized.
    const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
    if (authz instanceof NextResponse) return authz;
    const { userId } = authz;

    await prisma.user.update({
      where: { id: userId },
      data: {
        connectedXero: false,
        xeroTenantId: null,
        xeroTokens: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[xero/disconnect] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
