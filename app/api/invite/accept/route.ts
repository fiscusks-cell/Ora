import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { token, name, password } = parsed.data;

    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite) {
      return NextResponse.json({ error: 'invalid' }, { status: 404 });
    }

    if (invite.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 410 });
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      if (existing.organizationId === invite.organizationId) {
        return NextResponse.json({ error: 'already_accepted' }, { status: 409 });
      }
      // User exists in a different org — we will not move them
      return NextResponse.json({ error: 'different_org' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Atomic: create user and consume invite together
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email,
          name,
          passwordHash,
          role: invite.role,
          organizationId: invite.organizationId,
        },
      }),
      prisma.invite.delete({ where: { token } }),
    ]);

    return NextResponse.json({ ok: true, email: invite.email });
  } catch (err) {
    // Unique constraint violation — double-submit race
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'already_accepted' }, { status: 409 });
    }
    console.error('[invite/accept POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
