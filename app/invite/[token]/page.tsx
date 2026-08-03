import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InviteAcceptClient, { InviteState } from './InviteAcceptClient';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    return <InviteAcceptClient state="invalid" />;
  }

  if (invite.expiresAt <= new Date()) {
    return <InviteAcceptClient state="expired" />;
  }

  const orgName = invite.organization.name;

  // Check if a user with the invited email already exists
  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

  if (existingUser) {
    // Signed in as the invited email and already a member — just send them home
    if (session?.user?.email === invite.email) {
      redirect('/dashboard');
    }

    if (existingUser.organizationId === invite.organizationId) {
      return (
        <InviteAcceptClient
          state="already_accepted"
          email={invite.email}
          orgName={orgName}
        />
      );
    }

    // Exists in a different org — cannot move them
    return (
      <InviteAcceptClient
        state="different_org"
        email={invite.email}
        orgName={orgName}
      />
    );
  }

  // Valid invite, no existing user — check for signed-in mismatch
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
