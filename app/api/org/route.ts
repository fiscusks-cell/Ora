import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authz = await requireAuth();
  if (authz instanceof NextResponse) return authz;

  const org = await prisma.organization.findUnique({
    where: { id: authz.organizationId },
    select: { name: true, plan: true, billingPeriod: true },
  });

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(org);
}
