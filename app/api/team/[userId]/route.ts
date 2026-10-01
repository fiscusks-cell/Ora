import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // Only an owner may change roles, read from the database rather than the
    // token: this is the route a demoted admin would use to promote themselves
    // back, and their JWT would still say ADMIN.
    const authz = await requireAuth(
      ['OWNER'],
      'Only the organization owner can change member roles',
    );
    if (authz instanceof NextResponse) return authz;
    const { userId: callerId, organizationId } = authz;
    const { userId } = await params;

    // Cannot change own role
    if (userId === callerId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const member = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Cannot change another OWNER's role
    if (member.role === 'OWNER') {
      return NextResponse.json({ error: "Cannot change another owner's role" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[team/:userId PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // Removing a member deletes their time entries with them, so the caller's
    // role comes from the database, not from a token that may predate a demotion.
    const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
    if (authz instanceof NextResponse) return authz;
    const { userId: callerId, organizationId } = authz;
    const { userId } = await params;

    // Cannot remove self
    if (userId === callerId) {
      return NextResponse.json({ error: 'Cannot remove yourself from the organization' }, { status: 400 });
    }

    const member = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Cannot remove an OWNER
    if (member.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[team/:userId DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
