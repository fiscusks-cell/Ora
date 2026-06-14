import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  name: z.string().min(1).max(100),
  orgName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[register] received body keys:', Object.keys(body));

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.log('[register] validation failed:', parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, orgName, email, password } = parsed.data;
    console.log('[register] attempting registration for:', email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('[register] email already exists:', email);
      return NextResponse.json(
        { error: 'A user with that email already exists' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    console.log('[register] password hashed');

    const baseSlug = generateSlug(orgName);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const organization = await prisma.organization.create({
      data: { name: orgName, slug },
    });
    console.log('[register] organization created:', organization.id);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'OWNER',
        organizationId: organization.id,
      },
    });
    console.log('[register] user created:', user.id);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[register] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
