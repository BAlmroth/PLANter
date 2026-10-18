import { defineConfig } from "vitest/config";

//config for vitetest to ensure env variables are changed from real ones to local db to aviud removing data
export default defineConfig({
  test: {
    // Test values, set before the app loads. dotenv does not overwrite variables
    // that already exist, so these win over the real values in .env.
    // Not secrets: they point at the local Postgres.app test database.
    env: {
      FRONTEND_URL: "http://localhost:5173",
      DATABASE_URL: "postgresql://postgres@localhost:5432/planter_test",
      // Fake values: tests mock Supabase and never make a real call
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    },
    // Runs before every test file (safety guard against the wrong database)
    setupFiles: ["./tests/setup.ts"],
    // Run test files one at a time, so they don't clean up each other's data
    fileParallelism: false,
  },
});
