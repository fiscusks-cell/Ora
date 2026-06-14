import { XeroClient } from 'xero-node';
import { encrypt, decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

// ── client factory ────────────────────────────────────────────────────────────

export function makeXeroClient(): XeroClient {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [
      process.env.XERO_REDIRECT_URI ??
        `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/integrations/xero/callback`,
    ],
    scopes: ['openid', 'profile', 'email', 'accounting.transactions', 'accounting.contacts', 'offline_access'],
  });
}

// ── token types ───────────────────────────────────────────────────────────────

export interface XeroTokenSet {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix ms
  id_token?: string;
}

export function encryptTokens(tokens: XeroTokenSet): string {
  return encrypt(JSON.stringify(tokens));
}

export function decryptTokens(encrypted: string): XeroTokenSet {
  return JSON.parse(decrypt(encrypted));
}

// ── load + auto-refresh tokens for a user ────────────────────────────────────

export async function getValidXeroClient(
  userId: string,
): Promise<{ xero: XeroClient; tenantId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.xeroTokens || !user.xeroTenantId) {
    throw new Error('Xero not connected. Please connect via Settings → Integrations.');
  }

  const tokens = decryptTokens(user.xeroTokens);
  const xero = makeXeroClient();

  await xero.setTokenSet({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(tokens.expires_at / 1000), // xero-node uses unix seconds
    id_token: tokens.id_token,
    token_type: 'Bearer',
  });

  // refresh if within 5 minutes of expiry
  if (tokens.expires_at - Date.now() < 5 * 60 * 1000) {
    const refreshed = await xero.refreshToken();
    const newTokens: XeroTokenSet = {
      access_token: refreshed.access_token!,
      refresh_token: refreshed.refresh_token!,
      expires_at: (refreshed.expires_at as number) * 1000,
      id_token: refreshed.id_token,
    };
    await prisma.user.update({
      where: { id: userId },
      data: { xeroTokens: encryptTokens(newTokens) },
    });
  }

  return { xero, tenantId: user.xeroTenantId };
}
