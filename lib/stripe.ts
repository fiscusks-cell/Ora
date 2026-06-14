import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const PLANS = {
  FREE: { name: 'Free', price: 0, priceId: null, maxUsers: 1, maxProjects: 3 },
  PRO: { name: 'Pro', price: 12, priceId: process.env.STRIPE_PRO_PRICE_ID || null, maxUsers: 1, maxProjects: Infinity },
  TEAM: { name: 'Team', price: 49, priceId: process.env.STRIPE_TEAM_PRICE_ID || null, maxUsers: 15, maxProjects: Infinity },
};
