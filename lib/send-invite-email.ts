import { Resend } from 'resend';

interface SendInviteEmailParams {
  email: string;
  orgName: string;
  inviteUrl: string;
}

export async function sendInviteEmail({
  email,
  orgName,
  inviteUrl,
}: SendInviteEmailParams): Promise<{ error: unknown }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[send-invite-email] RESEND_API_KEY is not set — email NOT sent to ${email}.\n` +
      `  Invite URL (use this in dev): ${inviteUrl}`,
    );
    return { error: null };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'ORA <noreply@timetrack-ora.com>',
    to: email,
    subject: `You've been invited to ${orgName} on ORA`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You've been invited to join ${orgName} on ORA</h2>
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
  return { error };
}
