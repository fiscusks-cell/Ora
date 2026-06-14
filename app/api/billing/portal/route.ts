import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role;
    if (!['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const organizationId = (session.user as { organizationId: string }).organizationId;
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    let stripeCustomerId = org.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create a Stripe customer for this org
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: { organizationId: org.id },
      });

      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customer.id },
      });

      stripeCustomerId = customer.id;

      // A portal session requires at least one subscription — return a checkout link hint instead
      return NextResponse.json({ error: 'No billing account' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('[billing/portal POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
