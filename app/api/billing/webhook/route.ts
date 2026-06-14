import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (verifyErr) {
      console.error('[billing/webhook] Invalid signature:', verifyErr);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const planFromPriceId = (priceId: string): 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE' => {
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO';
      if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'TEAM';
      return 'FREE';
    };

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? '';
        const plan = planFromPriceId(priceId);

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan, stripeSubscriptionId: sub.id },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('[billing/webhook] Payment failed for customer:', invoice.customer);
        // No immediate action — Stripe retries and eventually fires subscription.deleted
        break;
      }

      default:
        // Unhandled event types are silently acknowledged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[billing/webhook POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
