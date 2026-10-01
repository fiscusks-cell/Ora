import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    // The Stripe portal can change the subscription and payment method for the
    // whole organization, so the role comes from the database.
    const authz = await requireAuth(['OWNER', 'ADMIN'], 'Admin access required');
    if (authz instanceof NextResponse) return authz;
    const { organizationId } = authz;
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
