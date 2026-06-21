import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;

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
