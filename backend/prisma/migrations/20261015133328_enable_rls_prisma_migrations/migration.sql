-- Prisma's own migration history table also lives in the public schema,
-- so Supabase's Data API can reach it. Lock it down like the other tables.
-- No policies on purpose: only Prisma (postgres role, bypasses RLS) may access it.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
