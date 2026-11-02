// Safety guard: tests will delete data, so they must never run against Supabase.
// Stops every test file if DATABASE_URL does not point at the local database.
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl.includes("localhost")) {
  throw new Error("Tests must use the local test database (DATABASE_URL must point at localhost)");
}
