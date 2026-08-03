import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InviteAcceptClient from './InviteAcceptClient';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    return await renderPage(token);
  } catch (err) {
    // redirect() throws a special NEXT_REDIRECT error — must propagate to the router
    if (isNextRedirectError(err)) throw err;
    console.error('[InvitePage] unhandled error:', err);
    return <InviteLoadError />;
  }
}

async function renderPage(token: string) {
  // Phase 1: session and invite in parallel — no include, org fetched separately below
  const [session, invite] = await Promise.all([
    auth(),
    prisma.invite.findUnique({ where: { token } }),
  ]);

  if (!invite) return <InviteAcceptClient state="invalid" />;
  if (invite.expiresAt <= new Date()) return <InviteAcceptClient state="expired" />;

  // Phase 2: org name and existing-user check in parallel — only reached for a non-expired invite
  const [org, existingUser] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true, organizationId: true },
    }),
  ]);

  const orgName = org?.name ?? 'your organization';

  if (existingUser) {
    // Already a member of this org and currently signed in as that email — just send them home
    if (session?.user?.email === invite.email) redirect('/dashboard');

    if (existingUser.organizationId === invite.organizationId) {
      return (
        <InviteAcceptClient
          state="already_accepted"
          email={invite.email}
          orgName={orgName}
        />
      );
    }

    // Exists in a different org — moving them would orphan their current access
    return (
      <InviteAcceptClient
        state="different_org"
        email={invite.email}
        orgName={orgName}
      />
    );
  }

  // No existing user — check for signed-in mismatch
  if (session?.user?.email && session.user.email !== invite.email) {
    return (
      <InviteAcceptClient
        state="wrong_user"
        token={token}
        email={invite.email}
        orgName={orgName}
      />
    );
  }

  return (
    <InviteAcceptClient
      state="valid"
      token={token}
      email={invite.email}
      orgName={orgName}
      role={invite.role}
    />
  );
}

// redirect() throws an object with a digest starting with NEXT_REDIRECT — must be re-thrown
function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

function InviteLoadError() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="text-center max-w-sm rounded-2xl p-10"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-lg mb-3" style={{ color: 'var(--text)' }}>
          Something went wrong
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          We couldn&apos;t load this invitation. Please try again, or ask your admin to
          resend the invite.
        </p>
      </div>
    </div>
  );
}
