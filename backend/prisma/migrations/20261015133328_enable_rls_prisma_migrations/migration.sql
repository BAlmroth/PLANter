-- Prisma's own migration history table also lives in the public schema,
-- so Supabase's Data API can reach it. Lock it down like the other tables.
-- No policies on purpose: only Prisma (postgres role, bypasses RLS) may access it.
-- IF EXISTS: Prisma's shadow database (used by `migrate dev`) has no
-- _prisma_migrations table, so the statement is skipped there instead of failing.
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
