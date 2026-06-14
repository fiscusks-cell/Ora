import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';

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

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const org = await prisma.organization.findUnique({ where: { id: organizationId } });
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

        await resend.emails.send({
          from: 'ORA <noreply@ora.app>',
          to: email,
          subject: `You've been invited to ${org?.name ?? 'an organization'} on ORA`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>You've been invited to join ${org?.name ?? 'an organization'} on ORA</h2>
              <p>Click the link below to accept your invitation. It expires in 7 days.</p>
              <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#3730A3;color:#fff;border-radius:6px;text-decoration:none;">
                Accept Invitation
              </a>
              <p style="margin-top:16px;color:#6B7280;font-size:14px;">
                Or copy this URL: ${inviteUrl}
              </p>
            </div>
          `,
        });

        return NextResponse.json({ ok: true, invite });
      } catch (emailErr) {
        console.error('[team/invite] failed to send invite email:', emailErr);
        // Invite was created — return success even if email failed
        return NextResponse.json({
          ok: true,
          invite,
          warning: 'Invite created but email delivery failed',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      invite,
      message: 'Invite created (email not sent - no RESEND_API_KEY)',
    });
  } catch (err) {
    console.error('[team/invite POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
