import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { connectedQBO: true, qboRealmId: true } });

  return NextResponse.json({ connected: user?.connectedQBO ?? false, realmId: user?.qboRealmId ?? null });
}
