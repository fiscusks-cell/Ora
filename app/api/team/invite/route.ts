import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendInviteEmail } from '@/lib/send-invite-email';

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role;
    if (!['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const organizationId = (session.user as { organizationId: string }).organizationId;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, role: inviteRole } = parsed.data;

    // Check if a user with this email already exists in the org
    const existing = await prisma.user.findFirst({
      where: { email, organizationId },
    });
    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
    }

    // Check for a pending invite that hasn't expired
    const existingInvite = await prisma.invite.findFirst({
      where: { email, organizationId, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json({ error: 'An active invite already exists for this email' }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invite = await prisma.invite.create({
      data: { email, organizationId, role: inviteRole, expiresAt },
    });

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    const { error: sendError } = await sendInviteEmail({
      email,
      orgName: org?.name ?? 'your organization',
      inviteUrl,
    });

    if (sendError) {
      console.error('[team/invite] Resend error:', sendError);
      // Roll back — a phantom invite blocks re-sending for 7 days
      await prisma.invite.delete({ where: { id: invite.id } });
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    console.error('[team/invite POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
