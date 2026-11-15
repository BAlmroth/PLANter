import { spawnSync } from "node:child_process";
import { getTestDatabaseUrl } from "./testDatabaseUrl.js";

// Applies all Prisma migrations to the local test database (npm run test:db:migrate).
// A Node script instead of "DIRECT_URL=... prisma migrate deploy" in package.json,
// because that way of setting a variable does not work in Windows cmd or PowerShell.

const url = getTestDatabaseUrl();

// Same safety guard as tests/setup.ts: never touch Supabase from here
if (!url.includes("localhost")) {
  console.error("TEST_DATABASE_URL must point at localhost, the local test database");
  process.exit(1);
}

// prisma.config.ts reads DIRECT_URL. Setting it here wins over the value in .env,
// because dotenv does not overwrite variables that already exist.
// shell: true so "npx" is found on Windows too (it is npx.cmd there).
const result = spawnSync("npx prisma migrate deploy", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DIRECT_URL: url },
});

process.exit(result.status ?? 1);
