import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';
import { sendInviteEmail } from '@/lib/send-invite-email';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await requireAuth(['OWNER', 'ADMIN']);
    if (authz instanceof NextResponse) return authz;
    const { organizationId } = authz;
    const { id } = await params;

    const existing = await prisma.invite.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    // Delete and recreate so Prisma generates a fresh cuid token —
    // same mechanism as the original prisma.invite.create in the invite route.
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [, invite] = await prisma.$transaction([
      prisma.invite.delete({ where: { id } }),
      prisma.invite.create({
        data: {
          email: existing.email,
          organizationId: existing.organizationId,
          role: existing.role,
          expiresAt,
        },
      }),
    ]);

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    const { error: sendError } = await sendInviteEmail({
      email: invite.email,
      orgName: org?.name ?? 'your organization',
      inviteUrl,
    });

    if (sendError) {
      console.error('[team/invite/:id/resend] Resend error:', sendError);
      // Do NOT delete the invite — admin is retrying, keep the new record in place
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    console.error('[team/invite/:id/resend POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
