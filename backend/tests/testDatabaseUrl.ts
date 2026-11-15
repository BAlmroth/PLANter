import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

// Default: Postgres.app on macOS (user "postgres", no password)
const DEFAULT_TEST_DATABASE_URL = "postgresql://postgres@localhost:5432/planter_test";

// The connection string for the local test database, used by vitest.config.ts and migrateTestDb.ts.
// Order: TEST_DATABASE_URL in the shell, then TEST_DATABASE_URL in backend/.env, then the default.
// Only this one variable is read from .env (parse does not touch process.env),
// so the real Supabase values in .env never reach the tests.
export function getTestDatabaseUrl(): string {
  const fromShell = process.env.TEST_DATABASE_URL;
  if (fromShell) return fromShell;

  if (existsSync(".env")) {
    const fromFile = parse(readFileSync(".env"))["TEST_DATABASE_URL"];
    if (fromFile) return fromFile;
  }

  return DEFAULT_TEST_DATABASE_URL;
}
