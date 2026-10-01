import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { getValidXeroClient } from '@/lib/xero';

export async function GET() {
  // Connection state belongs to the people who can act on it; the Integrations
  // tab is hidden from members for the same reason.
  const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
  if (authz instanceof NextResponse) return authz;
  const { userId } = authz;
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
