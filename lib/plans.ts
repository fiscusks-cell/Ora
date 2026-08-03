export type PlanKey = 'FREE' | 'PRO' | 'TEAM' | 'ADVANCED' | 'ENTERPRISE';

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  seats: number | null; // null = unlimited
  seatsLabel: string;
  description: string;
  features: string[];
  highlight: boolean;
  enterprise: boolean;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    seats: 1,
    seatsLabel: '1 user',
    description: 'For trying ORA out',
    features: ['3 projects', 'Time tracking', 'CSV export'],
    highlight: false,
    enterprise: false,
  },
  PRO: {
    key: 'PRO',
    name: 'Pro',
    monthlyPrice: 12,
    seats: 3,
    seatsLabel: '3 users',
    description: 'For solo freelancers',
    features: ['Unlimited projects', 'QuickBooks Online', 'Xero', 'PDF reports', 'Priority support'],
    highlight: true,
    enterprise: false,
  },
  TEAM: {
    key: 'TEAM',
    name: 'Team',
    monthlyPrice: 49,
    seats: 15,
    seatsLabel: '15 users',
    description: 'For growing firms',
    features: ['Everything in Pro', 'Team messaging', 'Project boards', 'Team analytics'],
    highlight: false,
    enterprise: false,
  },
  ADVANCED: {
    key: 'ADVANCED',
    name: 'Advanced',
    monthlyPrice: 99,
    seats: null,
    seatsLabel: 'Unlimited users',
    description: 'For established practices',
    features: ['Everything in Team', 'Custom invoice branding', 'API access', 'Advanced permissions'],
    highlight: false,
    enterprise: false,
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 249,
    seats: null,
    seatsLabel: 'Unlimited users',
    description: 'For large organisations',
    features: ['Everything in Advanced', 'SSO', 'Dedicated support', 'SLA'],
    highlight: false,
    enterprise: true,
  },
};

// Canonical display order for pricing tables and upgrade flows
export const PLAN_ORDER: PlanKey[] = ['FREE', 'PRO', 'TEAM', 'ADVANCED', 'ENTERPRISE'];

// Yearly billing: 2 months free = charge for 10 months, display as per-month
export function yearlyMonthlyPrice(monthlyPrice: number): number {
  if (monthlyPrice === 0) return 0;
  return Math.round((monthlyPrice * 10) / 12);
}
