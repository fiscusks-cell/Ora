import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidXeroClient } from '@/lib/xero';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { connectedXero: true, xeroTenantId: true },
  });

  if (!user?.connectedXero || !user.xeroTenantId) {
    return NextResponse.json({
      connected: false,
      tenantId: null,
      orgName: null,
    });
  }

  let orgName: string | null = null;
  try {
    const { xero } = await getValidXeroClient(userId);
    await xero.updateTenants();
    orgName = xero.tenants[0]?.tenantName ?? null;
  } catch {
    // token may be expired/revoked — still report connected state
  }

  return NextResponse.json({
    connected: true,
    tenantId: user.xeroTenantId,
    orgName,
  });
}
