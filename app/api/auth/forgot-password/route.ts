import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — don't reveal whether email exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, email, expiresAt },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'ORA <noreply@timetrack-ora.com>',
          to: email,
          subject: 'Reset your ORA password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#f5f5f5;padding:32px;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="#3730A3" stroke-width="2.5"/>
                  <circle cx="16" cy="16" r="10" stroke="#3730A3" stroke-width="1.5"/>
                  <line x1="16" y1="8" x2="16" y2="16" stroke="#3730A3" stroke-width="2.5" stroke-linecap="round"/>
                  <line x1="16" y1="16" x2="21" y2="19" stroke="#6366F1" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="16" cy="16" r="1.5" fill="#6366F1"/>
                </svg>
                <span style="display:block;font-size:24px;font-weight:900;letter-spacing:-0.5px;margin-top:8px;color:#fff;">ORA</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Reset your password</h2>
              <p style="color:#a0a0a0;margin:0 0 24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#3730A3;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Reset password
              </a>
              <p style="margin-top:24px;color:#555;font-size:13px;">
                Or copy this URL:<br/>
                <a href="${resetUrl}" style="color:#6366F1;word-break:break-all;">${resetUrl}</a>
              </p>
              <p style="margin-top:24px;color:#555;font-size:12px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[forgot-password] email send failed:', emailErr);
        // Token is in DB — user can retry; don't surface the error
      }
    } else {
      // Dev fallback: log the link so it's usable without email config
      console.log(`[forgot-password] reset link (no RESEND_API_KEY): ${resetUrl}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
