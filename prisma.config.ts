import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js stores local secrets in .env.local, not .env — load it explicitly
// so prisma CLI commands pick up DATABASE_URL outside of the Next.js runtime.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
