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

## 2026-10-15 – 2026-10-16: Project review and follow-up fixes

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** A review of the whole project (docs, `CLAUDE.md`, all code) covering improvements, risks and thoughts. I answered each point, and then asked the AI to implement the agreed fixes one at a time, checking with me before every commit.

**What was generated:** A written review (critical issues, risks, design questions, minor notes), explanations of RLS, composite foreign keys and the test setup, and the commits listed below.

### Implemented

**Frontend strict mode** (`fix: enable strict mode in frontend tsconfig`)
- I had added `"strict": true` at the top level of `frontend/tsconfig.json`, where it has no effect (TypeScript error TS6258). The AI moved it into `compilerOptions` in `tsconfig.app.json` and `tsconfig.node.json`, and verified it with `tsc --showConfig` and `tsc -b`.

**Same-project references** (`fix: enforce same-project references with composite foreign keys`)
- Problem found in the review: each foreign key on `relationships` (and `tasks.item_id`) was checked separately, so the database accepted a relationship in project A pointing at an item in project B, even another user's item. I had assumed the `project_id` column on items was enough.
- Decision: two layers. (1) The service never takes `projectId` from the body for relationships. It loads both items with an owner filter and responds 404 on a mismatch. This is written as a rule in `CLAUDE.md` and is implemented with the routes. (2) Composite foreign keys `(item_id, project_id) → items(id, project_id)` on `relationships` and `tasks.item_id`, so the database also refuses cross-project references.
- `tasks.sprint_id` deliberately keeps a single-column key: `ON DELETE SET NULL` on a composite key would also null the required `project_id`.
- Verified with `prisma validate`, an offline `prisma migrate diff` preview, and `prisma migrate dev`. Prisma's warning about the new unique constraint on `items(id, project_id)` was safe, because `id` is the primary key.

**Test setup** (`test: add vitest config, local test database and split tsconfig`)
- `vitest.config.ts` sets test values for `FRONTEND_URL` and `DATABASE_URL` (dotenv does not overwrite them), so tests no longer depend on `.env`, and runs test files one at a time (`fileParallelism: false`) so database tests don't interfere with each other.
- `tests/setup.ts` is a safety guard that stops all tests if `DATABASE_URL` is not localhost, so tests can never delete data in Supabase.
- `tsconfig.json` now type-checks `src`, `tests` and the config files (`noEmit`). The new `tsconfig.build.json` compiles only `src/` for the build. Reason: VS Code uses `tsconfig.json`, so tests now get strict checking, and tests are not compiled into `dist/`.
- Decision: **Postgres.app** as the local test database. Alternatives considered: a second Supabase project (slower, secret connection string, free projects pause), Docker (a heavy new tool), PGlite (new libraries, less proven with Prisma), and mocking Prisma (rejected because it can't prove that the database filters by owner or enforces the foreign keys). Postgres.app is real Postgres, needs no new libraries, and works because deny-all RLS means the migrations use nothing specific to Supabase.
- I removed an old Homebrew PostgreSQL 14 that I no longer used, because it blocked port 5432. Postgres.app runs PostgreSQL 18.6. All migrations applied to `planter_test` with `npm run test:db:migrate`, and the RLS check found no unprotected tables.
- Mocking `supabase.auth.getUser` for two-user tests is planned for when `requireAuth` is built.

**Build** (my own commits, from review notes)
- `"build": "prisma generate && tsc"`, because the generated client is gitignored and Prisma 7 doesn't generate it on install. Removed the `prisma skills sync` postinstall script and the `.cursor/` and `.devin/` skill files.

### Decided, not yet implemented
- **MVP:** not an item category. An `is_mvp` boolean on items. The plan's "MVP" category was badly phrased; `docs/project-plan.md` stays unchanged.
- **Project description:** a `description` column on `projects`, not an item type.
- **Tech stack and design:** stay item types (they count toward progress, can have relationships and appear on the map). No separate tables, because those would break the template rule, block relationships and complicate progress. Instead, a generic child table for detail rows per item (URL, text), plus project-level inspiration with `project_id`, which does not count toward progress. Images are postponed (they need Supabase Storage).
- **Progress formula:** `done / (planned + in_progress + done)`. In-progress items count as not finished, and an empty project gives 0%.
- **Relationships:** one direction only. The other side is shown with an inverse label (for example "used by"). Whether cycles are allowed is a template property per relationship type.
- **Deleting an item deletes its tasks** (cascade). The delete confirmation should say so.
- **Timestamps:** `timestamptz` in the database. The frontend shows them in the user's local time. Indexes on foreign key columns.
- **Template keys vs labels:** each type has a permanent `key` stored in the database and a `label` that can change freely. Renaming a key needs a data migration.
- **Service role key:** decide whether the backend needs it when `lib/supabase.ts` is written (`getUser` works with the anon key).

### What went wrong
- The AI created the `_prisma_migrations` migration folder by hand with a **local-time** timestamp, while Prisma names migrations in **UTC**. The migration created afterwards (`20261015114942_same_project_foreign_keys`) therefore sorts before it. This is harmless, because the two migrations are independent, and it was not renamed, because renaming applied migrations breaks Prisma's history. Lesson: always create migrations with `prisma migrate dev --create-only`.
- The first `_prisma_migrations` migration was committed before it was tested (see the entry above).
