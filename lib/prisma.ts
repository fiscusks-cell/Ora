import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({
    connectionString,
    // pg-pool closes an idle connection after 10s by default, so almost every
    // request that followed a pause paid a fresh TLS and auth handshake — and a
    // timer's Start and Stop always follow a pause. Keep idle connections for 4
    // minutes: long enough to cover a burst of activity, and short of Neon's
    // default 5-minute scale-to-zero, so the pool retires them itself rather than
    // handing out one the database has already terminated.
    idleTimeoutMillis: 4 * 60 * 1000,
    // Give up on a connection attempt that hangs rather than stalling the request
    // indefinitely. Waking a suspended compute has measured up to ~2.4s.
    connectionTimeoutMillis: 15 * 1000,
    // Notice connections dropped by the network while they sit idle.
    keepAlive: true,
  });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
