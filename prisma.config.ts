import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js stores local secrets in .env.local, not .env — load it explicitly
// so prisma CLI commands pick up DATABASE_URL outside of the Next.js runtime.
config({ path: ".env.local" });

/**
 * The URL the Prisma CLI (db push, studio, introspection) connects with.
 *
 * It must be a direct connection. Neon's "-pooler" host runs PgBouncer in
 * transaction mode, and Prisma's schema engine expects to hold one session for
 * the whole operation, so schema commands must never go through the pooler. The
 * app reads DATABASE_URL itself in lib/prisma.ts and is free to use the pooled
 * host at runtime; this keeps the CLI off it either way.
 *
 * DIRECT_URL wins when set. Otherwise DATABASE_URL is used, with a Neon
 * "-pooler" host rewritten to its direct endpoint.
 */
function directDatabaseUrl(): string {
  const explicit = process.env.DIRECT_URL;
  if (explicit) return explicit;

  const runtime = env("DATABASE_URL");
  const url = new URL(runtime);
  const [endpoint, ...rest] = url.hostname.split(".");
  if (!endpoint.endsWith("-pooler")) return runtime;

  url.hostname = [endpoint.slice(0, -"-pooler".length), ...rest].join(".");
  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directDatabaseUrl(),
  },
});
