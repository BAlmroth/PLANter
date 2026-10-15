# AI log

## 2026-10-15: Decision: RLS deny-all instead of ownership policies

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** A review of the project and an explanation of the suggestion to use RLS without policies, then to implement RLS on Prisma's `_prisma_migrations` table and update the documentation.

**What was generated:**
- Migration `20261015133328_enable_rls_prisma_migrations`, which enables RLS on `_prisma_migrations`.
- Updated rule 5 and the Definition of Done in `CLAUDE.md`, and the RLS row in `docs/tech-clarification.md`.

**Decision and why it differs from the plan:**
`docs/project-plan.md` (locked, not changed) says RLS is enabled on every table *with ownership policies*. I changed this to RLS enabled with **no policies** (deny-all).

- In PLANter the frontend never reads or writes tables (rule 1). All data goes through Express, and Prisma connects as the `postgres` role, which bypasses RLS. Ownership policies would protect a path that is never used.
- Ownership policies would actually open a back door. A logged-in user could use the anon key and their own token from the browser console to insert or update their own rows directly through Supabase's Data API. That skips Express, so it also skips Zod validation, the template rules and the relationship rules.
- With deny-all, `anon` and `authenticated` get nothing, so Express is the only way to the data, and every write is validated.
- Deny-all has no policy logic, so there is nothing to get subtly wrong (a missing `WITH CHECK`, a forgotten operation).
- The ownership check in Express (rule 3) is unchanged and is still the real protection.

**What I changed or corrected:** I created the first RLS migration (`20261015090145_enable_rls`) myself, using the SQL from the AI explanation. The AI review pointed out that `_prisma_migrations` was not covered, because Prisma creates that table itself in the `public` schema.

**What went wrong:** The AI created and committed the `_prisma_migrations` migration before it had been tested against a database. `npx prisma migrate dev` failed with P3006 / `42P01: relation "_prisma_migrations" does not exist`. The reason: `migrate dev` first replays all migrations in an empty shadow database, and Prisma doesn't create its history table there. The AI had assumed the table always exists. Supabase was not affected, because Prisma stopped before applying anything. Fixed by changing the statement to `ALTER TABLE IF EXISTS`, which skips the statement in the shadow database. Lesson: run the migration before committing it.
