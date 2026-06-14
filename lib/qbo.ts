import OAuthClient from 'intuit-oauth';
import { encrypt, decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

// ── client factory ────────────────────────────────────────────────────────────

export function makeOAuthClient() {
  return new OAuthClient({
    clientId: process.env.INTUIT_CLIENT_ID!,
    clientSecret: process.env.INTUIT_CLIENT_SECRET!,
    environment: (process.env.INTUIT_ENVIRONMENT as 'sandbox' | 'production') ?? 'sandbox',
    redirectUri: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/integrations/qbo/callback`,
  });
}

// ── token helpers ─────────────────────────────────────────────────────────────

export interface QBOTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix ms
  x_refresh_token_expires_in: number;
  realmId: string;
}

export function encryptTokens(tokens: QBOTokens): string {
  return encrypt(JSON.stringify(tokens));
}

export function decryptTokens(encrypted: string): QBOTokens {
  return JSON.parse(decrypt(encrypted));
}

// ── load + auto-refresh tokens for a user ────────────────────────────────────

export async function getValidClient(userId: string): Promise<{ client: OAuthClient; realmId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.qboTokens || !user.qboRealmId) {
    throw new Error('QuickBooks not connected. Please connect via Settings → Integrations.');
  }

  const tokens = decryptTokens(user.qboTokens);
  const client = makeOAuthClient();

  client.setToken({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: 'bearer',
    expires_in: Math.floor((tokens.expires_at - Date.now()) / 1000),
    x_refresh_token_expires_in: tokens.x_refresh_token_expires_in,
    realmId: tokens.realmId,
  } as Parameters<typeof client.setToken>[0]);

  if (client.isAccessTokenValid() === false) {
    const refreshed = await client.refresh();
    const raw = refreshed.getJson() as Record<string, unknown>;
    const newTokens: QBOTokens = {
      access_token: raw.access_token as string,
      refresh_token: raw.refresh_token as string,
      expires_at: Date.now() + (raw.expires_in as number) * 1000,
      x_refresh_token_expires_in: raw.x_refresh_token_expires_in as number,
      realmId: tokens.realmId,
    };
    await prisma.user.update({
      where: { id: userId },
      data: { qboTokens: encryptTokens(newTokens) },
    });
  }

  return { client, realmId: tokens.realmId };
}

// ── QBO base URL ──────────────────────────────────────────────────────────────

export function qboApiBase(realmId: string): string {
  const env = process.env.INTUIT_ENVIRONMENT ?? 'sandbox';
  const host = env === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
  return `${host}/v3/company/${realmId}`;
}
