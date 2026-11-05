# AI log

## IMPORTANT ##
NEVER DELETE THIS FILE. NEW ENTRIES ARE WRITTEN AT THE BOTTOM AND OLD ENTRIES ARE NOT TO BE TOUCHED OR CHANGED

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

## 2026-10-16: timestamptz and foreign key indexes

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** To implement two schema points from the project review (point 14) on the branch `feature/keyIndexes`, and to explain why the indexes are useful.

**What was generated:** Changes to `schema.prisma`. I created migration `20261016091829_timestamptz_and_indexes` with `prisma migrate dev` and applied it to Supabase and the local test database.
- `created_at` on `projects` and `items` changed from `timestamp` to `timestamptz(3)`. The database stores an exact moment, and the frontend will show it in the user's local time. The application code is unchanged (Prisma still returns a `Date`).
- 8 indexes on foreign key columns: `projects.user_id`, `items.project_id`, `relationships.project_id`, `relationships.target_item_id`, `tasks.project_id`, `tasks.item_id`, `tasks.sprint_id`, `sprints.project_id`.

**Decisions:**
- Postgres does not index foreign keys automatically. They are the columns PLANter searches by on almost every request (the ownership check, the File view, the map, "used by"), and Postgres uses them itself when it cascades deletes or sets values to null.
- `relationships.source_item_id` gets no extra index, because it is the first column of the unique `(source_item_id, target_item_id, type)`, which already covers it. `items.project_id` does need one, because the unique `(id, project_id)` starts with `id`.
- Only foreign key columns are indexed. Each index costs space and makes writes slightly slower.
- At the current data size the speed difference is not noticeable. It is done now because it is correct design and cheapest while the tables are empty.

**Verification:** `prisma validate`, an offline `prisma migrate diff` preview, `prisma migrate dev` (Supabase) and `npm run test:db:migrate` (local). Checked in the test database: 8 indexes, and `created_at` is `timestamp with time zone`.

**What I changed or corrected:** Nothing.

**What went wrong:** Nothing.

## 2026-10-16: CLAUDE.md updated with decisions from the project review

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** To update `CLAUDE.md` with the decisions from the project review that were not yet documented (branch `feature/updateDocs`). `docs/project-plan.md` stays unchanged.

**What was generated:** Changes to `CLAUDE.md` only.
- **MVP:** removed as an item type (in the intro and in the Must list). MVP is the `is_mvp` flag on items.
- **Project description:** a column on `projects`, not an item type.
- **Templates:** a template is plain data. Item types have `key`, `label` and whether they count toward progress. Relationship types have `key`, `label`, `inverseLabel` and `allowCycles`.
- **Keys vs labels:** keys are permanent and stored in the database, labels are only shown in the UI. Renaming a key needs a data migration, and an unknown key is shown as "Unknown".
- **`GET /api/templates/:key`:** the frontend gets the template from the API (with `requireAuth`) instead of keeping its own copy.
- **Relationships:** one direction, shown from both sides (`label` on the source, `inverseLabel` on the target). Cycle check with a graph search when `allowCycles` is false.
- **Data model:** tech stack and design stay item types (no separate tables). Item details and project inspiration are listed as tables still to be designed. Images are postponed (they need Storage). The schema decisions already made are documented: composite foreign keys, cascade-deleting tasks with their item (the delete confirmation must say so), `timestamptz`, and foreign key indexes.
- **Progress:** `done / (planned + in_progress + done)`, only for item types that count toward progress, and 0% when there are no items.
- **Should list:** "inspiration links and images per item" changed to item details (links and text) and project-level inspiration, with images later.

**Confirmed by me:**
- Cycle rule: only cycles of the **same** relationship type are checked (A → B is rejected if A can be reached from B through relationships of that type), because `allowCycles` is a property per relationship type. Cycles across different types are allowed.
- `is_mvp` stays a **Should** and stays on the cut line. It is not core to the product, but should be implemented if there is time. (The AI had pointed out that cutting it leaves the product with no MVP feature. I accept that.)

**What I changed or corrected:** Nothing.

**What went wrong:** Nothing.

## 2026-10-16: Schema for project description, item details and project inspiration

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** To implement the schema for point 10 from the project review (branch `feature/insp-detailsSchema`), after first going through the table design.

**Design decisions (mine, after the AI described the alternatives):**
- **Two tables** (`item_details`, `project_inspirations`) instead of one shared table with both `item_id` and `project_id`. Each table means one thing and has a simple foreign key.
- **Columns:** `title` is required. `url` and `text` are optional, with no "at least one" rule, so a row can be created with only a title and filled in later. No ordering column: rows are shown in `created_at` order.
- **Project description:** optional plain text, max 500 characters.
- **Length limits in Zod only, not in the database:** description 500, title 100, url 2000, text 2000. `url` must be `http://` or `https://` (blocks `javascript:` links, an XSS risk).
- **No `project_id` on `item_details` (the AI's recommendation, which I accepted).** Ownership is checked through the item in one Prisma query (`item: { project: { userId } }`). Storing `project_id` as well would duplicate data and need another composite foreign key to stay consistent. Relationships need `project_id` because they connect two items. A detail row belongs to exactly one item.

**What was generated:**
- In `schema.prisma`: `Project.description`, the models `ItemDetail` and `ProjectInspiration` (cascade delete and an index on the foreign key), and the back-relations `Item.details` and `Project.inspirations`.
- In `CLAUDE.md`: the two tables, the Zod limits and the URL rule.

**Migration:** `20261016095142_item_details_and_inspirations`, created with `prisma migrate dev --create-only`, so that RLS could be added before it was applied (rule 5: every new table gets RLS in the same migration). I added the two `ENABLE ROW LEVEL SECURITY` lines myself and applied the migration to Supabase and the local test database. The RLS check found no unprotected tables in either.

**What went wrong:** The AI ran `prisma format`, which re-aligned many existing lines in `schema.prisma` (only whitespace). That made the diff noisy and was not asked for. The AI restored the file and applied only the real changes.

**What I changed or corrected:** I added the RLS lines to the migration myself, instead of waiting for the AI.

## 2026-10-16: Personal notes kept out of the repo

**Tool:** Claude Code (Claude Opus 5.5)

**What I asked:** A file in `docs/` with things left to do from our sessions, and that neither that file nor this log is committed.

**What was generated:**
- `docs/todo.md`: open decisions and reminders from the review sessions, grouped by when they are needed. Plus the checklist for new tables and the small cleanups.
- `.gitignore`: `docs/todo.md` and `docs/ai-log.md`.
- `git rm --cached docs/ai-log.md` (branch `fix/removeLogs`): removed the log from git without deleting the local file.

**What I changed or corrected:** The first version of `todo.md` also listed general plan features. I asked for only the things we had talked about, and the AI trimmed it.

**Notes:** Older versions of this log remain in git history (commits already merged into `dev`). History was not rewritten. The Definition of Done says AI use is documented in `docs/ai-log.md`, so I need to decide how to hand in the log (noted in `todo.md`).

**What went wrong:** Nothing.

## 2026-10-16 to 2026-10-18: Frontend auth (AuthProvider, ProtectedRoute, login/register/logout)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/userRegistration`.

**What I asked**
- A walkthrough of how to set up `AuthProvider` cleanly, without over-engineering. I had already written `config/env.ts`, `supabaseClient.ts` and `api.ts` myself.
- A walkthrough of `ProtectedRoute`, then a review of my changed files.
- To move the routing out of `main.tsx` (review point 3).
- To create the login, register and logout pages, scalable but controlled and not overcomplicated.

**What was generated**
- `auth/authContext.ts` and `auth/AuthProvider.tsx`: auth state from `onAuthStateChange`, with a `loading` flag.
- `auth/ProtectedRoute.tsx`: redirect when logged out, wait while loading.
- Routing moved from `main.tsx` into `App.tsx`, plus a placeholder `pages/ProjectsPage.tsx`.
- `auth/AuthForm.tsx` (shared email and password form), `auth/Login.tsx`, `auth/Register.tsx` and `auth/LogoutButton.tsx`.

**Why the pages were generated instead of written by me**
- I was short on time. The review of my changed files took a lot of time, so I asked the AI to create the login, register and logout pages rather than writing them myself, as I had done for the earlier files.
- Because I did not write these files, I need to make sure I understand them before building on them.

**What I changed or corrected**
- Wrote the `AuthProvider` wrapping in `main.tsx` and the route tree in `App.tsx` (the `Login` and `Register` imports) myself.
- Kept the `/willbelogin` redirect in `ProtectedRoute` on purpose, as a placeholder (it should become `/login`).
- Tested the whole flow in the browser (register, log out, log in, wrong password, reload). It works.

**What went wrong or was noted**
- `react-router-dom` was in `package.json` but not listed in `CLAUDE.md`.
- Small cleanups were pointed out: a misleading comment in `env.ts` ("server" instead of frontend) and a misindented `return` in `api.ts`.
- The review pointed out that routing in `main.tsx` made `App` a page and an app shell at once, which led to the move into `App.tsx`.

## 2026-10-18: Backend middleware, Zod validation and error handler

**Tool:** Claude Code (Sonnet 5.5), branch `dev`. I also used claude.ai to understand the generated code, to save Claude Code credit. That use is not logged in detail here.

**What I asked**
- A walkthrough of a good way to implement the issue "Backend middleware, Zod validation and error handler". Zod is new to me.
- After the first walkthrough I told it to read `CLAUDE.md` and everything in `docs/` before planning, because it had missed context.
- What the difference is between the Supabase anon key and the service role key.
- To create the files, which I would then review thoroughly.
- A detailed explanation of `validate.ts` and how it uses Zod.

**What was generated**
- A walkthrough of Zod (schema, `safeParse`, inferred types) and a six-step plan: env, Supabase client, `errorHandler`, `validate`, `requireAuth`, temporary route, tests.
- A corrected plan after the AI read `docs/project-plan.md`, `docs/todo.md`, `docs/tech-clarification.md` and `docs/ai-log.md`: it had assumed the service role key, but `docs/todo.md` listed that as an open decision.
- An explanation of anon key vs service role key: both can verify a token with `getUser`, but the service role key bypasses RLS, so a leak would undo rule 5.
- Code changes:
  - `config/env.ts`: added `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
  - `vitest.config.ts`: fake Supabase values for tests.
  - `app.ts`: registers the temporary route, then the 404 handler and the error handler last.
- New files:
  - `lib/supabase.ts`: backend client with the service role key and `persistSession: false`.
  - `middleware/errorHandler.ts`: `HttpError` class, `notFoundHandler` and `errorHandler` (one error shape, invalid JSON gives 400, unknown errors give 500 without leaking details).
  - `middleware/validate.ts`: Zod `safeParse` on `req.body`, 400 with `z.flattenError` details, and `req.body` replaced with the parsed data.
  - `middleware/requireAuth.ts`: reads the Bearer token, calls `supabase.auth.getUser`, sets `req.userId` (with a `declare global` to type it), otherwise 401.
  - `routes/testRoute.ts`: temporary `POST /api/_test`.
  - `tests/middleware.test.ts`: 7 Supertest tests with `vi.mock` on Supabase (fake tokens `token-a` and `token-b`). They cover no token (401), invalid token (401), valid token (200), invalid body (400), a `userId` in the body being ignored, an unknown route (404 in the error shape) and invalid JSON (400).
- Result when generated: `npm run typecheck` clean, 8 tests passing (including the earlier health test).

**What I changed or corrected**
- Told the AI to read the docs first. This led to the corrected plan above.
- Decided to use the service role key now, because it matches the plan and the issue text, even though the AI recommended the anon key (least privilege). I accept that the key then sits in the backend unused except for token checks, and I take responsibility for keeping it out of the repo and logs.

**What went wrong or was noted**
- The AI's first plan did not read `docs/` and treated an open decision (service role key) as settled. It also planned the test-mocking approach without checking that `docs/todo.md` had already decided it.
- The AI added things that were not in the issue: the `HttpError` class and the 404 handler for unknown routes. Both are small, but they were not asked for, and `validate` and `requireAuth` now depend on `HttpError`.
- `errorHandler` logs unknown errors with `console.error`. Those can contain request details, so this needs checking against rule 6 (secrets) before deploying.
- `validate` only checks `req.body`. Params and query strings are not validated yet, and `req.body` is still typed `any` in the route handlers. Both are for the first real routes.
- I did not write these files myself, because I wanted to see a good structure first. I need to be able to explain every line before building on them (as I noted for the login pages).

**Insights and what I learned**
- Zod: a schema describes valid data. `safeParse` never throws and returns either `{ success, data }` or `{ success: false, error }`, so the code can handle both with an `if`. The type of the data can be inferred from the schema (`z.infer`), so the shape is written once.
- `validate.ts` is a function that returns a middleware. The outer function runs once at route setup and remembers the schema, and the inner one runs on every request.
- Zod object schemas strip unknown fields by default. Replacing `req.body` with the parsed result is what stops a made-up `userId` in the body from reaching a route, and that supports rule 2.
- Middleware order matters: `requireAuth` runs before `validate`, so an anonymous caller gets a 401 and learns nothing about the schemas.
- Express 5 forwards errors thrown in async handlers to the error handler, so there is no need for try/catch in each route. An error handler is recognised by having four parameters.
- Authentication (`requireAuth`: who are you?), validation (`validate`: is the input well formed?) and ownership (a later shared helper: is it yours?) are three separate steps, and none of them replaces another.
- The anon key vs service role key choice does not change how the code works, only how much damage a leak does. Prisma does not use either key, it uses `DATABASE_URL`.
- Testing without the real service: `vi.mock` replaces the Supabase client with a fake, and two fake tokens map to two users, which prepares the two-user ownership test in sprint 2.
- Reading the project docs before planning matters. The AI missed an open decision, and I only caught it because I asked it to read them.

### Deploy (same day, same session)

**What I asked**
- Whether deploy is the next step after the middleware.
- How to deploy only `backend/` to Heroku, since the repo has both `frontend/` and `backend/`.
- What the Vercel project needs, and whether any files must be added or changed for production.

**What was generated**
- A reason for deploying next, taken from `docs/todo.md` ("never cut the deploy") and the sprint 1 goal (login working in the deployed setup).
- Instructions for pushing only `backend/` to Heroku with `git subtree push --prefix backend heroku dev:main`, run from the repo root. It included the order (config variables before the first push, because `prisma generate` needs `DIRECT_URL`), a suggestion to add an `engines` field for the Node version, and a list of what can go wrong.
- Checks before the deploy: the Git remote, that all five Heroku config variables existed (values hidden), and that the working tree was clean.
- After the push: the Heroku logs, which showed a successful build and `State changed from starting to up`. It also noted that the real app URL has a suffix (`planter-api-741253331c3c.herokuapp.com`).
- `frontend/vercel.json` (rewrite every path to `index.html`, needed because the app uses `BrowserRouter`) and `frontend/.env.example`.
- A local `npm run build` of the frontend, which passed (only a chunk size warning).
- Vercel instructions (root directory `frontend`, Vite preset, three `VITE_` variables set before the first build, anon key and not the service role key) and follow-up steps (update `FRONTEND_URL` on Heroku, Supabase Site URL and Redirect URLs).

**What I changed or corrected**
- Decided on Heroku myself, created the app and added the Heroku remote.
- I interrupted the AI's first attempt to run the `git subtree push` and ran the deploy myself instead, both to Heroku and to Vercel.
- Updated the environment variables on both hosts myself and committed the new files.

**What went wrong or was noted**
- The AI first tried a `curl` against `planter-api.herokuapp.com`, which returned "No such app", because Heroku adds a suffix to the URL. The real URL came from `heroku info`.
- The AI suggested an `engines` field for the Node version. No `engines` field was added before the deploy, so Heroku used its default Node version, which may differ from my local version (Node 26).
- The frontend does not call the backend yet (`ProjectsPage` is a placeholder), so CORS is not tested by the real app. Only `/health` was verified on the backend, and register and login on the frontend.
- The temporary route `/api/_test` is deployed. It is behind `requireAuth`, but it must be deleted when the real routes exist.
- The RLS check against the live Data API was done afterwards. A curl with the anon key to `/rest/v1/projects` returned `permission denied for schema public` (code 42501). The AI had said it should return `[]`, which is what RLS alone gives. This was a stricter block: the `anon` role cannot use the `public` schema at all. That does not prove RLS is on, so I also ran `select tablename from pg_tables where schemaname = 'public' and not rowsecurity;` in the Supabase SQL editor, and it returned no rows.

**Insights and what I learned**
- Heroku deploys whatever is at the root of the repo it receives. For a monorepo, `git subtree push --prefix backend` sends only that folder as if it were the whole repo, without extra buildpacks. The remote branch must be `main` or `master`.
- Config variables must be set before the first build when the build itself needs them (`prisma generate` reads `DIRECT_URL`).
- `VITE_` variables are baked into the bundle at build time, so they are public, and changing them needs a redeploy. That is why the service role key must never have that prefix.
- A single-page app with `BrowserRouter` needs a rewrite to `index.html` on the host, or a reload on a client-side route gives a 404.
- CORS needs an exact origin match, so `FRONTEND_URL` on Heroku must be the Vercel URL without a trailing slash, and preview URLs will not work.
- Deploying early is useful because it shows environment and host problems while they are cheap to fix. The Heroku logs (`heroku logs --tail`) are the first place to look when something fails.
- A permission error and an empty list are both a pass for the Data API check, but they mean different things (schema access blocked vs rows blocked by RLS). The RLS check must be done separately with SQL, and the thesis should describe the result accurately.

## 2026-10-18: React Flow prototype (sprint 1)

**Tool:** Claude Code (Sonnet 5.5), branch `dev`.

**What I asked**
- A walkthrough of React Flow for the prototype issue, since I had never used it. I had created `features/map/ItemNode.tsx` and an empty `pages/MapPrototypePage.tsx` and suggested using mock data.
- Whether positions created automatically when an item is created could be an issue, and an assessment of the Should item "Create items and connections from the map and save node positions".
- Two follow-ups: log drag events in the prototype, and note the position problem in `docs/todo.md`.

**What was generated**
- `features/map/mockData.ts`: 6 nodes, 5 edges with labels, and types for the node data (category as a template key, plus a temporary label lookup).
- `features/map/ItemNode.tsx`: custom node with category, title, status and handles.
- `pages/MapPrototypePage.tsx`: `ReactFlow` with `useNodesState`/`useEdgesState`, `Background`, `Controls` and `fitView`. A temporary `/map-prototype` route in `App.tsx`.
- An `onNodeDragStop` console log, and a new "Item positions on the map" section in `docs/todo.md`.
- The assessment: positions default to (0, 0) so items stack, with a suggested rule (backend computes a start position per category); the risks for sprint 4 (save on drag stop, mixed state, failed saves, batch updates, connection rules, delete confirmation).

**What I changed or corrected**
- Ran the page in the browser and checked the drag log myself: it prints once per released drag, with the coordinates.
- I corrected nothing in the generated code. The AI also corrected my sprint number: the item is in sprint 4 in the plan, not sprint 3.

**What went wrong or was noted**
- The AI wrote the whole prototype (about 100 lines) in one go, although CLAUDE.md asks for small steps. I need to read through it so I can explain every line.
- The prototype route is public, and the edge directions, categories and statuses are mock values. All of it is temporary.
- The AI did not run the page in a browser, only typecheck and lint.

**Insights and what I learned**
- React Flow is controlled: without `onNodesChange` nodes cannot be dragged. Nodes and edges are plain data, and a custom node is a component registered in `nodeTypes`, defined outside the component.
- Edges need `Handle` components in the custom node, and the parent needs an explicit height.
- `onNodeDragStop` fires once per drag, `onNodesChange` fires many times, so saving positions belongs in the first.
- A column default of 0 for positions is a design decision that has to be made before the map shows real data.

**Decision:** continue with React Flow or Plan B: _(to be filled in by me)_


## 2026-10-19 to 2026-10-20: Web template, templates route and tests (sprint 2)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/webTemplate`.

**What I asked**
- A review of my first version of `backend/src/templates/index.ts` (the `Template` type and `getTemplate`) and `web.ts`, after reading `CLAUDE.md` and the docs.
- Follow-up questions: is the "depends on" relationship type needed, how to handle tech stack (project-wide, not per component) and progress, and how to show page to page navigation.
- To fix the `getTemplate("constructor")` bug, and to build `GET /api/templates/:key` (uses `requireAuth`, returns the template as JSON, 404 in the normal error shape) with tests for 200, 401 and 404.
- What `routes/templates.ts` does, and why the Zod schema was not in `schemas/` as `CLAUDE.md` says.
- Whether turning a Zod error into a 400 is best practice, and then to put it in `validate.ts`.
- Template data tests, with detailed help since Vitest and Zod are new to me.

**What was generated**
- Review feedback: `getTemplate` bug, `counterLabel` vs `inverseLabel`, wrong direction rule comment, missing plural labels, typos, no check that keys in `allowedCombinations` exist, and a suggestion to use a `types.ts` later.
- Code:
  - `index.ts`: `templates` changed from a plain object to a `Map`, and `pluralLabel` moved into the `itemTypes` entries of the `Template` type.
  - `web.ts`: the `page triggers page` combination.
  - `routes/templates.ts`: the route.
  - `schemas/templates.ts`: `templateParamsSchema`.
  - `app.ts`: mounts the router at `/api/templates`.
  - `validate.ts`: now takes a source, `validate(schema, "body" | "params")`.
- `CLAUDE.md` line 3: "depends on" removed from the example relationship types.
- Tests (24 backend tests pass in total after this session), described in detail below.

### The tests, file by file

Vitest runs every `*.test.ts` file in `backend/tests/` with `npm test`. `describe("name", () => {...})` groups tests. `it("does X", () => {...})` is one test. `expect(value).toBe(...)` is an assertion, and a test fails if one is wrong. If an assertion has a second argument, as in `expect(list, "message").toContain(x)`, the message is shown when it fails.

**`tests/templates.test.ts`, the route (4 tests).** It uses Supertest: `request(app).get("/api/templates/web")` sends a fake HTTP request to the Express app without starting a server.
- `vi.mock("../src/lib/supabase.js", ...)` replaces the real Supabase client with a fake, so no test makes a real call. In the fake, only `"token-a"` is a valid token. The mock is hoisted by Vitest above the imports, so `requireAuth` gets the fake version.
- 200 with a valid token: `.set("Authorization", "Bearer token-a")` and the body equals `webTemplate`. This shows the route sends the real template data.
- 401 without a token: proves `requireAuth` protects the route (rule 2).
- 404 for `"nope"`: the body must equal exactly `{ error: { message: "Template not found" } }`, which checks the one error shape in `CLAUDE.md`.
- 404 for `"constructor"`: the regression test for the `getTemplate` bug.

**`tests/validate.test.ts`, the `validate` middleware (2 tests).**
- Why a separate file: the template route has no param that can fail validation (a key is always a non-empty string), so it cannot test the 400 case. The test builds its own small Express app with one route, `/:id`, checked with `validate(z.object({ id: z.uuid() }), "params")`, and the real `errorHandler`.
- Zod: `z.object({...})` describes valid data, `z.uuid()` accepts only UUID strings. `validate` calls `schema.safeParse(...)`, which returns `{ success, data }` or `{ success: false, error }` and never throws.
- Invalid param (`/not-a-uuid`): status 400, message "Invalid request params", and `details.fieldErrors.id` exists. `z.flattenError` is what produces `fieldErrors`.
- Valid param: the request continues to the route and returns the id.

**`tests/templates.data.test.ts`, the template data (10 tests).** These test the data in `web.ts` and not the HTTP behaviour. A typo in a key such as `"componnent"` compiles fine, because keys are plain strings, and would silently never match. These tests catch it. They are the safety net for things that are easy to forget when a template is edited.
- Unique item type keys and unique relationship type keys: `new Set(keys).size` equals `keys.length`, because a Set removes duplicates.
- Every combination's source, target and relationship refer to a key that exists. A loop checks each combination, and the failure message names the bad key.
- No duplicate combinations (source, relationship, target). Later a relationship has a unique constraint on (source, target, type), so a duplicate here would be a design mistake.
- Every relationship type is used in at least one combination. This catches a type that was defined and forgotten.
- Every label, plural label and inverse label is non-empty.
- `getTemplate`: `"web"` returns `webTemplate`, and `"nope"`, `"constructor"` and `"__proto__"` return `undefined`.

**What I changed or corrected**
- I decided to remove "depends on" (it was an example in the plan) and asked the AI to update `CLAUDE.md`. The `docs/project-plan.md` still mentions it, which I left as it is the thesis plan.
- I decided that tech stack is project-wide and counts toward progress when it is `done` ("fill it in to get progress").
- I chose option A for navigation: `page triggers page`.
- I fixed the direction rule comment and renamed `counterLabel` to `inverseLabel` myself, to match `CLAUDE.md`.
- I pushed back when the AI had put the Zod schema in the route file, and asked about the 400 conversion. The AI's answer was not to catch every `ZodError` in the error handler, but to convert at the input boundary, so I chose to extend `validate.ts`.
- I added `pluralLabel` in the wrong place (the `Template` type itself). The AI pointed it out, and it was moved to the item types.

**What went wrong or was noted**
- The AI first put `paramsSchema` in `routes/templates.ts` and said it could be moved later, against rule 4 in `CLAUDE.md` ("Schemas live in `backend/src/schemas/`"). I had to point it out. The AI moved it.
- The AI wrote the route, the `validate` change and all the tests in single steps, although `CLAUDE.md` asks for small steps. I need to read through all of it so I can explain every line.
- TypeScript types `req.params.key` as `string | string[] | undefined`, so the first typecheck failed. The fix was a cast, `req.params as z.infer<typeof templateParamsSchema>`, which is safe only because `validate` has already checked the value.
- `validate` has a source of `"body"` or `"params"` only. `req.query` is read-only in Express 5, so a query source is left for the first route that needs it.
- The `getTemplate` tests overlap with the route tests (the `"constructor"` case is in both). I kept both on purpose.
- The template data tests only check that the data is consistent. They do not check that the rules make sense for users, for example whether a combination is missing. That is a design decision I have to make.
- Tests were run by the AI, but no real Supabase token was used. Only the mocked `requireAuth` was tested, as in sprint 1.

**Insights and what I learned**
- Using a plain object as a lookup (`templates[key]`) is unsafe when the key comes from the user: `"constructor"` and `"__proto__"` are found through the object prototype. A `Map` only contains what is put in it.
- Validating where input comes in (the body or the URL) and sending a 400 there is better than catching all `ZodError`s in the error handler. A `ZodError` from my own code (config, a database row) is a server bug and should be a 500.
- `safeParse` returns a result, `parse` throws. `validate` uses `safeParse` so it can control the error shape.
- Plain-data templates make good test targets: a short loop over the data replaces many manual checks, and the tests make me think about the rules each time the template changes.
- A test with its own tiny Express app is a good way to test a middleware without needing a real route that can fail.
- Keys in strings are not checked by TypeScript. A test is what protects them, until the types are made stricter.

## 2026-10-20 to 2026-10-21: Project CRUD (schemas, service, routes, tests)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/CRUD`.

**What I asked**
- To review and fix my project schema, which did not work in the project service.
- That the project description must allow `""` and spaces, but be safe from scripts.
- To fix the project id validation in the `GET /:id` route (`getOwnedProject` and the route were mine).
- To review my update and delete, and to add the empty PATCH check.
- To write the project tests, and to fix an error on line 11 of the project service.

**What was generated**
- `CreateProjectInput` in `schemas/projects.ts` (`z.infer<typeof createProjectSchema>`), used by the service.
- The fixed `GET /:id` route: `validate(projectIdSchema, "params")` plus the same cast as in the templates route.
- The empty PATCH check: `.refine(...)` on `updateProjectSchema`.
- The `exactOptionalPropertyTypes` fix in `createProject` and `updateProject` (only fields that were sent are passed to Prisma).
- `tests/projects.test.ts` (22 tests), and a convention about user text in `CLAUDE.md`.

**What I wrote myself**
- `createProjectSchema`, `projectIdSchema` and `updateProjectSchema` (`.omit({ template: true }).partial()`).
- `listProjects`, `getOwnedProject` (the shared ownership helper), `updateProject` and `deleteProject`, and the routes.

**What the tests do (`tests/projects.test.ts`)**
- **Setup.** The tests run through the real Express app with Supertest and the real local database `planter_test`, so they test the whole chain: `requireAuth`, `validate`, the ownership check, the service and Prisma. Only Supabase is mocked: `token-a` is user A and `token-b` is user B, as in the other test files. The user ids are real UUIDs, because `user_id` is a uuid column. Before each test, and after the file, the rows of these two users are deleted, so tests do not depend on each other and never touch other data. A helper creates a project through the API, so every test starts from known data.
- **Create (6 tests).**
  - No token gives 401.
  - The project gets the `userId` of the token. A `userId` in the body is ignored, so user B cannot create a project as user A.
  - The name is trimmed and `description: ""` is accepted, which was a decision in this session.
  - Empty name, unknown template and a description over 500 characters give 400. For the first two, the test also checks that the error is on the right field (`fieldErrors`).
- **List (1 test).** After A and B each create a project, A sees only A's project.
- **Get one (4 tests).** The owner gets 200. Another user gets 404, and so does an id that does not exist. The same 404 means the API does not reveal that someone else's project exists (rule 3). A non-UUID id gives 400, which shows that `projectIdSchema` runs before the database.
- **Update (6 tests).**
  - The owner can change name and description.
  - Only the fields that were sent change (a PATCH with just `description` keeps the name).
  - User B gets 404, and then user A's project is read again to prove it was not changed. Without that second check, the test would pass even if the update had gone through.
  - An empty `{}` body gives 400.
  - `template` and `userId` in the body are ignored, so the project stays `web` and owned by A.
  - A non-UUID id gives 400.
- **Delete (3 tests).** User B gets 404 and the project still exists afterwards. The owner gets 204, and a following GET gives 404. A missing id gives 404.
- **Not covered yet.** Cascade delete (items, relationships, tasks) is not tested, because those routes do not exist yet. It should be added in sprint 2 when items are added.

**What I changed or corrected**
- Decided that the description may be `""` and spaces, so it is not trimmed. I decided to skip the extra test for a `<script>` description.
- Decided where script safety belongs: React escapes text when it is shown, so the protection is in how the frontend renders, not in a Zod schema. The AI added this as a rule in `CLAUDE.md` after I asked for the note.
- Chose to add the empty PATCH check.

**What went wrong or was noted**
- I used the Zod schema as a TypeScript type (`input: createProjectSchema`). A schema is a value, and the type is `z.infer<typeof ...>`.
- The GET route had `const { id } = projectIdSchema, req.params;`. A comma, not a call, so the schema never ran.
- The `exactOptionalPropertyTypes` error. The tsconfig is strict about optional fields. Zod's `.partial()` gives `string | undefined`, and Prisma does not accept `undefined`. The first fix, `{ ...input }`, did nothing. The real fix is to build `data` from only the fields that were sent.
- The first test run gave 500 on create and update. The generated Prisma client in `src/generated` (gitignored) was out of date and did not know `description`. `npx prisma generate` fixed it. This also hid the same type error in `createProject`, which showed up as the "error on line 11" after the client was regenerated.
- The tests were run by the AI against the local `planter_test` database. Nothing was run against Supabase.
- Two functions now use the same "only send what was defined" pattern. If it appears in items too, it should become a small helper.

**Insights and what I learned**
- A Zod schema is a runtime value. `z.infer` gives the TypeScript type, so the shape is defined only once.
- `validate(schema, "params")` before the handler means a bad id gives 400 instead of a 500 from Postgres.
- `findFirst({ where: { id, userId } })` plus a 404 is how ownership and "does not exist" become the same answer.
- Testing "user B cannot change A's project" needs a second read as user A. A 404 alone does not prove that nothing changed.
- After a change in `schema.prisma`, `npx prisma generate` must be run. A stale client causes errors that look like code bugs.


## 2026-10-21: Frontend project pages (list, create, view, edit, delete) and API tests

**Tool:** Claude Code (Sonnet 5.5), branch `feature/CRUD`.

**What I asked**
- To read the docs and the current code, and to recommend an architecture for three project pages (list, create, project page) before writing any code.
- To go through it in small steps. I decided: `useEffect` + `useState` and no data-fetching library, no template dropdown (with a comment), `todo.md` entries for the delete confirmation, plain HTML now and CSS modules later.
- Whether `ApiError`/`apiRequest` belongs in `api.ts` or in its own file, whether `type="button"` is needed, and whether the slow loading on localhost will be a problem when deployed.
- To write the frontend tests before starting item CRUD, and then this log entry.

**What was generated**
- The recommendation: routes (`/`, `/projects/new`, `/projects/:projectId`), the layers (pages -> hooks -> `projectsApi.ts` -> `lib/api.ts`) and a list of decisions for me.
- `ApiError` and `apiRequest<T>` in `lib/api.ts`: parses JSON, handles 204, reads the backend's `{ error: { message, details } }` shape and throws `ApiError`.
- `useProjects` and `useProject` (loading, error, refetch), `ProjectCard`, `ProjectForm` (shared by create and edit), `ProjectsPage`, `NewProjectPage` and `ProjectPage` with edit and delete (`window.confirm`).
- The routes in `App.tsx`, entries in `docs/todo.md`, the frontend `test` script and `src/lib/api.test.ts` (9 tests).

**What I wrote myself**
- `features/projects/types.ts` and `projectsApi.ts`, including `getProject`, which I added after the review pointed out that it was missing. I also trimmed some of the generated comments in the hooks and pages afterwards.

**What the tests do (`src/lib/api.test.ts`)**
- Supabase and the env check are replaced with fakes, and `fetch` is a mock, so no request is sent. They test `apiRequest` only, because everything else in the frontend calls it.
- Requests (2 tests): the token is sent as a Bearer header to the API url, and no header is sent when there is no session.
- Success (2 tests): the parsed JSON is returned, and 204 (DELETE) returns `undefined`.
- Errors (5 tests): the backend's error shape becomes an `ApiError` with status, message and details. A 404 keeps its status. A non-JSON body (a 502 page) and JSON without the error shape both give "Request failed (status)". A network failure gives status 0.
- **Not covered:** `ProjectForm`, the hooks and the pages. They need `@testing-library/react`, which is not installed. I will decide whether to add it (it is in `todo.md`). I also did not test in the browser during this session beyond type checking and ESLint, so the pages still need a manual run-through.

**What I changed or corrected**
- Decided that edit sends `""` to clear the description and create leaves it out, so new projects get `null`. The display treats `""` and `null` the same.
- Decided to keep `ApiError` in `api.ts` for now. It would only be moved if a test needs it without the Supabase and env imports. The mocks made that unnecessary.
- Decided to keep `type="button"` on every button outside forms, as `LogoutButton` already does.
- Decided to skip timing code for the slow localhost requests, and to find out where the time goes in the browser's Network tab instead.

**What went wrong or was noted**
- I wrote "app.ts" when I meant `api.ts`, and the AI assumed it, which turned out right but was a guess.
- I said I had written the hook, but I had not. The AI looked for the file and found none, so the hooks were generated. This is why they are listed above as generated.
- The first test run failed: "Cannot access 'getSession' before initialization". `vi.mock` is moved to the top of the file, above the fake it uses. `vi.hoisted` fixes it.
- The slow loading on localhost is not explained yet. The likely reason is two round trips to Supabase (Ireland) on each request: `getUser` in `requireAuth` and the Prisma query. React StrictMode also sends every request twice in development. The backend region and host sleeping (free tiers) need to be checked before the first deploy of the pages.
- The generated code is typechecked and linted, not reviewed in the browser yet.

**Insights and what I learned**
- A hook should hold the state of one request. Storing the id together with the answer makes "loading" something that is calculated, so a page never shows the previous project.
- A cleanup function in `useEffect` (`cancelled = true`) stops an answer that arrives late from updating a component that is gone.
- A button is `type="submit"` by default, so `type="button"` is needed for any button that sits in a form.
- `vi.mock` is hoisted. A fake used inside it must be created with `vi.hoisted`.
- The same 404 for "missing" and "not yours" is handled on the page by one message. The 400 for a bad uuid in the URL is mapped to "not found" too.


## 2026-10-21 to 2026-10-22: Item CRUD in the backend (schemas, service, routes, tests)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/CRUD`.

**What I asked**
- To recommend the next step after the project pages, and then to write the item service, routes and tests.
- Whether the item type should be changeable after creation. I decided yes. If the new type makes relationships invalid, they should not be dropped silently: the API rejects the change, and the client confirms with an explicit flag (sprint 3, in `todo.md`). Until relationships exist there is nothing to drop.
- To review my `schemas/items.ts`, and whether the 500 character limit on the item description is needed or handled elsewhere.
- What "nested" routes means, before the routes were written. I also decided the default position (0, 0) is fine for now.
- To keep the frontend test next to the code, and to note it in `CLAUDE.md`.

**What was generated**
- `services/items.ts`: `getOwnedItem` (`findFirst({ id, project: { userId } })`), `listItems`, `createItem`, `updateItem`, `deleteItem`, and a check that `type` exists in the project's template (400 with the same `fieldErrors` shape as `validate()`).
- `routes/items.ts`: `projectItemsRouter` (`GET` and `POST /api/projects/:projectId/items`, `Router({ mergeParams: true })`) and `itemsRouter` (`GET`, `PATCH` and `DELETE /api/items/:id`), both with `requireAuth` first, mounted in `app.ts`.
- `tests/items.test.ts` (25 tests), the item description limit in `CLAUDE.md`, the sprint 3 type-change note in `todo.md`, and the note about where frontend tests live.

**What I wrote myself**
- `schemas/items.ts` (create and update schemas, the status enum, the two param schemas), the same layout as `schemas/projects.ts`.
- I renamed the template check to `checkItemTypeInTemplate` and shortened some comments in the service afterwards.

**What the tests do (`tests/items.test.ts`)**
- They run through the real Express app with Supertest and the local database `planter_test`. Only Supabase is faked (`token-a` and `token-b`), as in `projects.test.ts`.
- Create (8): 401, the defaults (`planned`, not MVP, position 0, 0), optional fields, the project taken from the URL (a `projectId` in the body is ignored), an unknown type gives 400 on the `type` field, bad title/status/description give 400, another user's project gives 404 and creates nothing, and a missing or non-uuid project.
- List (3): only the items of that project in creation order, an empty list, 404 for another user's project.
- Get (3), update (7) and delete (3): the owner succeeds, another user gets 404 and the item is unchanged afterwards, a non-uuid id gives 400, an unknown type gives 400, and a `projectId` in the body cannot move an item to another project.
- Cascade (1): deleting a project deletes its items. This was the gap noted in the project CRUD entry.
- **Not covered:** relationship dropping on a type change (sprint 3), the frontend for items, and manual checks against Supabase. Nothing here was run against Supabase.

**What I changed or corrected**
- Decided that the item description limit is 500 and that it is written in `CLAUDE.md`. The limit is needed: the database column is unlimited `text`, the frontend `maxLength` can be skipped with any HTTP client, and Express only stops bodies over about 100 kB.
- Changed the "at least one field" message so items and projects say the same.
- Chose two small routers, each with `router.use(requireAuth)`, instead of one router with full paths. This changed the AI's first suggestion: one router mounted at `/api` would answer 401 for unknown routes, and adding `requireAuth` by hand to every route is easy to forget.
- Kept the "send only defined fields" spread pattern from `projects.ts`. It now appears in five places, and a helper is an option if it grows.

**What went wrong or was noted**
- The test files run in parallel against one database, and `projects.test.ts` deletes the rows of its two users before every test. The items tests would have deleted each other's data, so they use their own two user ids (`...0c` and `...0d`). This was caught when planning the test file, before the first run. Every future test file needs its own pair of users.
- All tests passed on the first run, which proves little. I removed the owner filter from `getOwnedItem` on purpose and ran the tests again. Two cases failed, but the PATCH test for another user's item still passed. Cause: a request with `type` runs a second ownership check (`getOwnedProject`), which hid the missing filter. A test with only a title was added, and then 3 tests failed under the same change. The filter was restored and the full suite passed (69 tests).
- An update that changes `type` does two ownership queries, and an item deleted between the check and the update gives a 500. Both are small and match the project service, so they were left as they are.
- I staged files with `git add .` in the wrong terminal. No harm was done.
- The generated code is typechecked and tested, but the item routes have not been called from the browser yet.

**Insights and what I learned**
- A nested route (`/api/projects/:projectId/items`) puts the parent in the URL. An id that identifies the item alone (`/api/items/:id`) does not need it, and ownership is checked through the project.
- `mergeParams: true` is needed for a router to see params from the path where it is mounted.
- Whether an item type is valid depends on the project's template, so the check is in the service and not in the Zod schema.
- A test that passes on the first run should be tried against a deliberate bug. A test can pass because another check hides the bug.
- Tests in different files run at the same time, so they must not share the rows they delete.


## 2026-10-25: Review of the File view and add item form (frontend)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/itemCRUD`.

**What I asked**
- To review my File view and `ItemForm`, and to help with the "pick type for item" dropdown, which I thought did not work.
- To fix the review notes (not the formatting), then to add minimal tests and this log entry.

**What was generated**
- A review of `FileView.tsx`, `ItemForm.tsx`, the hooks and the backend item routes. It found no bug in the type picker and listed what to check in the browser (the Network tab for `GET /api/templates/web` and the `POST` for items).
- Small fixes: `UpdateItem` and `DeleteItem` renamed to `updateItem` and `deleteItem`, `setItems` in `useItems.ts` now also accepts a function (`items.setItems((current) => [...current, item])`), and `ItemForm` only updates its own state when `onSubmit` returns an error.
- `itemsApi.test.ts` (4 tests): checks the path, method and JSON body that each function in `itemsApi.ts` gives to `apiRequest`, which is replaced with a fake.

**What I wrote myself**
- created the whole fileview and item crud by myself. so all of `features/items`.
- `FileView.tsx` with the add item form and `ItemForm.tsx`. I also renamed the button to "Add item" myself.

**What I changed or corrected**
- The type picker worked. The problem was my own misunderstanding, so no code change was needed there.
- I decided to leave the formatting of `useItems.ts` and `types.ts` for later, and to wait with more tests.

**What went wrong or was noted**
- The first rename with `sed` failed on macOS (BSD `sed` needs different syntax), so the rename was done with the edit tool instead.
- The tests are minimal on purpose. They do not render React components: that needs a library such as `@testing-library/react`, which is not in the plan, so I need to decide on it before adding it. `useItems`, `ItemForm` and `FileView` are not tested yet.
- The unmounted-form fix assumes the parent closes the form on success. A form that stays open after saving would need to reset `submitting` itself.

**Insights and what I learned**
- A review without running the app can only show that code looks right. Checking the Network tab is the quickest way to find out which side is wrong.
- A state update that depends on the current value should use the function form (`setState(current => ...)`), so a late answer cannot overwrite a newer list.


## 2026-10-25 to 2026-10-26: Edit and delete for items in the File view

**Tool:** Claude Code (Sonnet 5.5), branch `feature/itemCRUD`.

**What I asked**
- To add edit and delete for items, with checkboxes for status and `is_mvp`.
- Then to show MVP only in the edit form, and not in the normal File view.
- Then to log this and check whether the item CRUD and File view tests follow the plan.

**What was generated**
- `ItemRowCard.tsx`: "In progress" and "Done" checkboxes (neither checked = `planned`), an Edit button that opens `ItemForm` inline, and a Delete button with `window.confirm`. Each action calls `updateItem` or `deleteItem` and shows an error under the item if it fails.
- `FileView.tsx`: `replaceItem` and `removeItem`, which update the list with the function form of `setItems`.
- `ItemForm.tsx`: a new `isMvp` value and an MVP checkbox that is only shown when editing (no `types` prop).

**What I wrote myself**
- The read-only "MVP" text on items in the normal File view (`{item.isMvp && <p>MVP</p>}`).
- The fix for the import spelling (`itemForm` to `ItemForm`), which broke on case-sensitive systems.

**What I changed or corrected**
- The first version had an MVP checkbox on every item in the File view. I wanted it only in the edit form, so it was moved, and I then added the read-only marker myself.
- Status has three values, so the AI used two checkboxes instead of one. I kept this.

**What went wrong or was noted**
- The delete confirmation has no counts yet ("This also deletes its connections and tasks"), because relationships and tasks do not exist until sprint 3. There is a TODO in the code.
- The new components (`ItemRow`, `ItemForm`, `FileView`) have no tests. They need `@testing-library/react`, which is not in the plan.
- Nothing here was tested in the browser by the AI. I tried it myself.

**Insights and what I learned**
- A status with three values does not fit one checkbox. Two checkboxes that exclude each other work, but a dropdown would show the three values more clearly.
- The same form component can be used for add and edit by leaving out props (`types`), but then the form must decide what to show from which props it has.


## 2026-10-26: Relationship rules, service and routes (sprint 3)

**Tool:** Claude Code (Sonnet 5.5), branch `dev`.

**What I asked**
- How to build the relationship rules with Zod, without overengineering, and to read the docs first so the answer fits the sprint plan.
- To then build it in small steps: schemas and their tests, then the service (ownership and template rules), then the cycle check, then the routes.
- Later: to look into why `npm run test` failed, to write this log, and to do the `updateItem` TODO (a type change that makes connections invalid).

**What was generated**
- `schemas/relationships.ts`: `createRelationshipSchema` (UUIDs, a type, source is not equal to target, no `projectId`), `relationshipIdSchema` and `relationshipRuleSchema(template)`, which checks a combination of source type, relationship type and target type against `template.allowedCombinations` with `.refine`.
- `services/relationships.ts`: `createRelationship` (loads both items in one query filtered on the owner, 404 if not exactly two items or if their projects differ, rule check with 400, cycle check, create, readable 400 on a duplicate), `wouldCreateCycle` (a pure depth-first search), `listRelationships` and `deleteRelationship`.
- `routes/relationships.ts` (`POST /api/relationships`, `GET /api/projects/:projectId/relationships`, `DELETE /api/relationships/:id`) and the two routers mounted in `app.ts`.
- `updateItem` in `services/items.ts`: when the type changes, it checks the item's incoming and outgoing relationships against the template. If any would become invalid it responds 409 with `{ invalidRelationships: n }`. With `confirmRelationshipRemoval: true` in the body, it deletes those relationships and updates the item in one `prisma.$transaction`. The schema `updateItemSchema` got the new optional flag.
- Tests: `relationshipRules.test.ts` (Zod only), `relationships.test.ts` (service with the database, plus the cycle search) and `relationships.api.test.ts` (Supertest, including two users). Five more in `items.test.ts` for the type change (409 with count and nothing changed, only invalid ones counted, confirm deletes only invalid ones, other edits leave connections alone, incoming connections checked).

**What I wrote myself**
- Decisions on scope: Zod only judges the combination and the service fetches the data, and the cycle check stays outside Zod.
- Edited the comments in `schemas/relationships.ts` after it was generated.
- Removed the temporary `/api/_test` route and `testRoute.ts`, as its own comment said to do when real routes exist.

**What I changed or corrected**
- The first typecheck failed in the tests because `noUncheckedIndexedAccess` makes `Record<string, string>` lookups `string | undefined`. The test helper got a generic type so the ids are plain strings.
- After I removed the temporary route, `tests/middleware.test.ts` failed with 404s because it still called `/api/_test`. The AI moved those tests to `POST /api/relationships` and dropped two tests that depended on the temp route (a 200 with a valid token and a body `userId` being ignored). The same ideas are covered in the items and relationship API tests. The total went from 102 to 100 tests.

**What went wrong or was noted**
- The AI did not run the full suite after I deleted the temporary route, so the stale tests were only found when I ran `npm run test`.
- The cycle check reads the existing relationships and then writes, without a lock. Two requests at the same moment could both pass and create a loop. I accepted this for a single-user planning tool and can name it as a known limit in the thesis.
- An unknown project template throws a plain `Error` (500), because it would be a data bug and not a user mistake.
- 409 Conflict is a new status code that `CLAUDE.md` does not list (it names 400, 401 and 404). It was chosen so the frontend can tell "needs confirmation" from a plain validation error. `todo.md`, mentioned in the old TODO comment, does not exist in the repo.
- One of the new type change tests first had a title that did not match what it checked ("changes the type without asking" while expecting 409). The AI renamed it after noticing.
- The frontend does not handle the 409 yet: changing the type in `ItemRowCard` would show a generic error. It should read `invalidRelationships`, ask for confirmation and re-send with the flag.
- No frontend work yet: the React Flow map and the connections in the File view are still to do.

**Insights and what I learned**
- Zod cannot look in the database. The pattern is: fetch with Prisma, then let a Zod schema judge the fetched facts (`relationshipRuleSchema(template)`).
- `.refine` adds a custom rule on top of the built-in checks, and a schema can be a function that depends on the template.
- Ownership is checked in the query itself (`project: { userId }`), so another user's resource looks the same as one that does not exist (404).
- A TypeScript `Record` lookup is `T | undefined` with `noUncheckedIndexedAccess`, so a generic helper is a cleaner fix than `!` everywhere.
- A change that touches more than one table should be one transaction (`prisma.$transaction([...])`), so a failure cannot leave half of it done.


## 2026-10-26: Relationships in the frontend: map, File view and connect forms (sprint 3)

**Tool:** Claude Code (Sonnet 5.5), branch `dev`.

**What I asked**
- To build the React Flow map, then to show connections in the File view.
- Then an idea of my own: create a new item from an item and have it connected automatically (for example an image on the About page).
- Then that the connections were confusing: I wanted to pick the type of the new item ("a component") and see clearly how it is connected ("belongs to the page", "is triggered by").
- Then to add connecting to an existing item and a delete button for connections.
- Then a correction of my own: editing, deleting and connecting belong in a detail view of an item, not in the File view. The File view should only add items and show connections as text. The AI asked me which I meant, because my message said the File view both can and cannot add connections.

**What was generated**
- `features/relationships/`: `types.ts`, `relationshipsApi.ts` (list, create, delete), `useRelationships.ts` (loading, error, `setRelationships`), `connections.ts` (`getConnections`, `getConnectOptions`, `getTypeChoices`), `ConnectedItemForm.tsx` and `ConnectExistingForm.tsx`, and `connections.test.ts` (10 tests).
- `features/map/MapView.tsx`: a read-only React Flow map of the real items and relationships. Labels come from the template. Items without a saved position (all of them for now) are placed in one column per type. `ItemNode` got an optional `categoryLabel`.
- `ProjectPage.tsx`: a File view / Map switch.
- Connections shown on an item, from both sides (`label` on the source, `inverseLabel` on the target) with the other item's type. The delete confirmation for an item says how many connections it also deletes.
- Detail view (after my correction): `ItemDetail.tsx` and `pages/ItemPage.tsx` with the route `/projects/:projectId/items/:itemId`. It holds status, edit, delete, the connections with a Remove button, "Add connected item" and "Connect existing item". The File view (`FileView.tsx`, `ItemRowCard.tsx`) became read-only apart from "Add Item", and each title links to the detail view.
- Add connected item: the form reads from the new item's side as a sentence, with a live preview ("Button (Component) belongs to About (Page)"). Type first, then only the verbs that are allowed for that type, all from `allowedCombinations`. It makes two requests (create the item, create the relationship) and deletes the new item again if the relationship is refused.

**What I wrote myself**
- The idea of creating connected items from an item, and the decision to read the connection as a sentence from the new item's side with type and verb as separate choices.
- Decisions on scope: the map is read-only for now, positions are not saved yet, and fixing the details of the connection rules waits until I can see the whole picture.

**What I changed or corrected**
- The first version of the connect form had one dropdown with labels like "uses Asset" and "contains Component". It was hard to read, so it was rebuilt: type first, then a filtered verb, then a preview.
- A test failed because its test template had no item types, so the type label was "Unknown". The test data was fixed, not the code.

**What went wrong or was noted**
- I first asked for the connect forms and Remove in the File view and moved them to a detail view afterwards, so that work was done twice. The plan did say "item detail view", but I did not think about where the controls belong until I saw them. The AI did not raise it either.
- The AI used "Button triggers Home" as an example, but the web template has no `component triggers page`. I found it when I tried it. The form only offers combinations the template allows, so nothing was wrong in the code, but the AI's example was wrong. Adding that combination (and others) is postponed until I decide the rules.
- The two-request create is not atomic. If the browser closes between the requests, an unconnected item stays. A backend route with a transaction would fix it.
- Nothing here was tested in a browser by the AI, and the components have no tests. They need `@testing-library/react`, which is not in the plan, so that is still a decision for me.
- The detail view loads its own data, so going back to the File view fetches the list again. Connections and map nodes do not link to the detail view yet.
- Still open: the 409 confirmation in `ItemRowCard` when changing an item's type (and the edit form cannot change the type yet), saving node positions, and creating connections from the map (Sprint 4).

**Insights and what I learned**
- Everything the user sees about types and verbs can come from the template, so a new template needs no frontend change.
- A relationship has one direction but is read from two sides, so one pure function (`getConnections`) can serve both the File view and later the map.
- A form is easier to understand when it reads as a sentence with a live preview.
- A list that is held in state (`useItems`, `useRelationships`) needs a setter, so the screen can update after create and delete without loading everything again.
- Decide where a control belongs (list or detail) before building it. A list that only shows and links, and a detail view that changes things, is easier to explain and to test.


## 2026-10-28: Type editing with confirmation, map link and elbow lines (sprint 3)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/flowMap`.

**What I asked**
- To add the frontend side of the 409 for item type changes (editing the type and a confirmation).
- Then a link from the map to the detail view, and whether the map can look like a screenshot I had (a tree with 90 degree lines).
- Then, after the AI explained what the screenshot needs, to do only the elbow lines now and leave the tree layout for later.

**What was generated**
- `ItemForm.tsx`: the type dropdown (`types`) and the MVP checkbox (`showMvp`) are now two separate options.
- `ItemDetail.tsx`: the edit form has a type dropdown. If saving gets a 409, it asks with `window.confirm` ("Changing the type to Design deletes 2 connections that are no longer allowed. Continue?"). On OK it sends the changes again with `confirmRelationshipRemoval: true` and reloads the connections. On cancel the form stays open.
- `typeChange.ts` with `getInvalidRelationshipCount(err)` (reads the count from a 409 and checks the shape of `details`), and `typeChange.test.ts` (4 tests). `UpdateItemInput` accepts the confirm flag.
- `MapView.tsx`: `onNodeClick` opens `/projects/:projectId/items/:id`, and edges use `type: "smoothstep"` (90 degree bends). `ItemNode.tsx`: handles moved to the left (in) and right (out).

**What I wrote myself**
- The decision to do only the elbow lines now and to put the tree layout last (a Could item, end of sprint 5, after saved positions exist).
- The screenshot I wanted the map to look like.

**What I changed or corrected**
- The AI could not open my screenshot from the macOS temp folder (a permission error) and did not work around it. I saved a copy in the project and it could then read it.
- The AI first asked me to choose between three options for the map look. I stopped it to ask what was unclear, and it then answered my actual question (should this wait for the next sprint) with a recommendation instead.

**What went wrong or was noted**
- The 409 and confirm flow has no component test. It lives in the edit form's `onSubmit` and needs `@testing-library/react`, which is not in the plan. The backend side is fully tested.
- The count in the confirmation does not say which connections will go, because the 409 only sends a number.
- If an item's stored type is not in the template, the type dropdown shows the first type. Saving without touching it still does not change the type.
- The screenshot is in `frontend/src/assets/`. It is not an asset of the app, so it should be moved or removed.
- The map has no arrowheads: direction is only shown by the left-to-right handles and the label. Nothing here was tested in a browser by the AI.
- The tree layout needs a template field saying which side of each relationship type is the parent (for example `belongs_to`: the target, `uses`: the source), so it is a template and layout decision, not only styling.

**Insights and what I learned**
- Two behaviors that sit in one flag (`!types` meant both "adding" and "no MVP checkbox") should be separate options, or the form cannot be reused for editing.
- Dragging and clicking are different events in React Flow, so a click handler on a node does not fire after a drag.
- A map layout (where nodes are) and an edge style (how lines are drawn) are separate things: the second is a one-line change, the first is a feature.


## 2026-10-30: Template relationship changes (sprint 3)

**Tool:** Claude Code (Sonnet 5.5), branch `feature/flowMap`.

**What I asked**
- A note that I had changed the `belongs_to` relationship to read "used by", and that one item must be usable by many things (a button on many pages).
- Then: why a component could not be connected to a page.
- Then to keep the old key after the AI asked about renaming it.
- Then that page to page should read "navigates to" (inverse "reached by") and not "triggers", and the same for component to page.

**What was generated**
- A diagnosis of why the Connect forms offered nothing for component to page: my edit to `web.ts` spelled the key `used_tby` but the combinations said `used_by`. The AI fixed the typo, then updated the tests when I had chosen a new key, and reverted all of it when I changed my mind and kept `belongs_to`.
- `web.ts`: a new relationship type `navigates_to` ("navigates to" / "reached by", loops allowed), and the combinations `page navigates_to page` and `component navigates_to page`, which replace `page triggers page`. The `triggers` type is unchanged for the other combinations.
- Two tests in `relationshipRules.test.ts` (navigating is allowed, triggering between those types is not).

**What I wrote myself**
- The change of label for `belongs_to` to "used by" / "uses", and the comment next to it.
- The decisions: keep the old key, add `navigates_to` for pages and components, and skip a data migration for old connections.

**What I changed or corrected**
- I started to rename the key `belongs_to` to `used_by`. The AI warned that a key change needs a data migration (the project rule: keys are permanent, labels are free), and I decided to keep the old key and change the label only.
- The AI had to explain that a label belongs to a relationship type, not to one combination, so renaming "triggers" for page to page only was impossible without a new type.

**What went wrong or was noted**
- The typo in the key (`used_tby`) was my own and broke the forms and 10 tests. The template data test ("only uses relationship types that exist") caught it, which is the reason that test exists.
- The AI's `navigates_to` edit was missing from `web.ts` when it ran the tests again, so it had to be applied a second time. I do not know how it went missing.
- Old connections saved as `triggers` between page and page (and any `belongs_to` rows, if the key had changed) are not migrated. I accepted this because the data is throwaway. Those rows still exist but are no longer an allowed combination.
- A component can already be used by many pages, because the database only forbids the exact same (source, target, type) twice. This is not proven by a test yet.

**Insights and what I learned**
- Keys are for the code and the database, labels are for people. Changing a label is free, changing a key needs a data migration.
- Words that mean the same in the UI ("used by" and "uses") can be different types with different directions in the data.
- A test that checks the template data against itself catches typos that would otherwise just make options silently disappear.


## 2026-11-02: Start positions for new items on the map (sprint 3)

**Tool:** Claude Code, branch `feature/mapPositions`. Models used in the session: Sonnet 5.5, then Opus 5.5, then Haiku 5.5 (switched with `/model`).

**What I asked**
- To look at a screenshot of the map where a line from a page to an asset ran through a function node that was not connected to the line.
- To optimize the start positions of new items once more.
- Then to choose between three options: keep the current rule, save dragged positions in sprint 4, or lay out unplaced items from their relationships.
- To do point 2 of my own list (move the node type out of `mockData.ts` and remove the prototype page), and then to commit.

**What was generated**
- `backend/src/services/itemLayout.ts`: `startPosition(itemTypeKeys, type, existing)`. One column per item type in template order (220 px), and the first free row in that column (110 px). It is a plain function and does not touch the database.
- `backend/tests/itemLayout.test.ts` (5 tests): first item, column order, stacking, filling a gap after a delete, and ignoring moved items.
- `createItem` in `services/items.ts` loads the positions of the same type in the project and saves the result.
- `frontend/src/features/map/types.ts` with the node types. `ItemNode.tsx` and `MapView.tsx` import from there.
- Removed `features/map/mockData.ts`, `pages/MapPrototypePage.tsx` and the `/map-prototype` route.

**What I wrote myself**
- The decision to keep the start-position rule for sprint 3 and to put saved dragged positions in sprint 4 (option 1).
- The decision to remove the prototype page once nothing used `mockData.ts` except that page.
- The commit split: one commit for the backend rule, one for the map cleanup.

**What I changed or corrected**
- The AI first treated "fix point 2" as the layered layout (option 2). That added a nullable position column, a hand-written migration and a frontend layout function. I had meant point 2 of my list, the cleanup. I asked for a revert, and the AI undid the migration on the local test database and rebuilt the start-position rule from the earlier version, which was never committed.
- The migration was written by hand instead of with `prisma migrate dev`, because the local config had no shadow database and `.env` points at Supabase. The SQL was checked by applying it to `planter_test` and diffing the database against the schema. That work was then reverted.
- My own analysis of the screenshot was not checked in the browser. The line running through the function is only explained by the relationships in the screenshot, not confirmed visually.

**What went wrong or was noted**
- A layered layout would fix the screenshot case, but it would only work for items without a saved position. Items with a saved position can still overlap or cross lines until sprint 4.
- The layout rule uses item type columns, not relationships. Lines between columns can still pass through a node in the same row. This is accepted until auto-layout (a Could item).
- The local test database was changed by hand twice (once up, once down). The schema and the database were checked to match after both changes.
- Nothing was pushed. The backend is not yet redeployed with this change.

**Insights and what I learned**
- "Keep as is" and "fix point 2" can point to different things. When a list has numbered points, say which point before changing code.
- The rule for where an item goes, and the rule for how a line is drawn, are separate problems. A column rule cannot prevent a line from crossing a node, because it does not know the lines.
- A nullable column is the right way to say "not placed yet", but it changes every reader of that column, so it is a bigger step than it looks.

## 2026-11-02: Progress calculation, route and views (sprint 4)

**Tool:** Claude Code (Haiku 5.5), branch `dev`.

**What I asked**
- To read the docs and give an overview before starting sprint 4, then to start with the progress calculation.
- To continue with the progress route, and later to add the frontend progress view.
- Whether a progress bar could sit next to the project title, and whether in-progress items could be shown without counting toward the bar.
- To commit the work and add this log entry.

**What was generated**
- `backend/src/services/progress.ts`: `countProgress` (done, in progress, total and percent for one set of items) and `calculateProgress` (filters to the template's item types with `countsTowardProgress`, one entry per category in template order). Both are pure functions. `getProjectProgress` does the ownership check, loads the items with Prisma and calls `calculateProgress`.
- `GET /api/projects/:id/progress` in `routes/projects.ts`, with `requireAuth` and the uuid check.
- Tests: `tests/progress.test.ts` (unit, 10 tests) and `tests/progress.api.test.ts` (Supertest with two users, 7 tests). The full backend suite went from 100 to 131 tests.
- Frontend in `features/progress/`: `types.ts`, `progressApi.ts` (+ test), `useProgress.ts`, `ProgressBar.tsx` (native `<progress>` with the numbers as text), `ProgressOverview.tsx` (per category labels from the template). `ProjectPage.tsx` has a third tab, "Progress", and a bar next to the title (`ProjectPage.module.css`).

**What I decided or changed**
- The percent is `done / total`, rounded with `Math.round`. `total` includes planned and in-progress items, as the plan's formula says. In-progress items are shown as a count ("· 2 in progress") and do not change the percent.
- The route is on the existing projects router, not in a new file, because it is a sub-resource of a project.
- A project with an unknown template key throws a plain Error (500), the same rule as for relationships.
- The Progress tab first fetched its own numbers. When the header bar needed the same numbers, I moved the fetch up to `ProjectPage` and changed `ProgressOverview` to take the data as props. This was a second version of the same code, and it could have been decided before the first version.
- `refetch` keeps the old numbers on screen until the new ones arrive, so the header does not flicker when the view changes.

**What went wrong or is still open**
- The header bar is only refreshed when the view changes or the page reloads. Edits made in the File view do not update it until then. Fixing this needs a callback from the File view to the page. Not done yet.
- The browser was not run by the AI. Only typecheck, lint and the automated tests were run. The new components have no component tests, because `@testing-library/react` is not in the plan and needs a decision.
- The frontend progress files were not in any commit when this session started, although the frontend had been described as committed. They are committed with this entry.
- The percent rounding (1 of 3 = 33%) is a choice that the thesis should mention.

**Insights and what I learned**
- A pure function (`countProgress`) can be tested without the database. The API test then only checks that the route is wired correctly and that ownership is enforced.
- The same numbers in two places (header and tab) need one owner: the parent holds the state, and the children receive it as props.
- A native `<progress>` element gives a bar with no new library, which fits the rule that libraries are added only from the plan.
- Keeping the old numbers while a refetch runs avoids a flicker, but the screen can then show numbers that are a little out of date for a moment.

## 2026-11-02: Pre-deploy review, fixes and README (sprint 4)

**Tool:** Claude Code (Opus 5.5, switched with `/model`), branch `dev`.

**What I asked**
- To review the whole project before deploying the MVP: inconsistencies, overengineering and better solutions, checked against my list of deploy issue points.
- Then to do the code fixes and write the README.

**What was found**
- Deploy: the Heroku backend was from 2026-10-30 (no start positions, no progress route), `origin/main` was 83 commits behind `dev`, and `backend/package.json` had no `engines` field (local Node 26, Heroku default unknown).
- Bug: the map still had its own fallback for items "without a position", which treated (0, 0) as unplaced. Since the backend gives every item a start position, (0, 0) is a real spot, and after a delete and a new item two nodes could land on the same place.
- Inconsistencies: "Welcome, [name]" placeholder on the projects page, the template key `web` shown on project cards (the UI should only show labels), an item delete message that mentioned tasks that do not exist yet, a frontend `env.ts` comment copied from the backend, `STATUS_LABELS` defined twice, and `routes/relationships.ts` importing a project param schema from `schemas/items.ts`.
- Leftovers from the Vite template: `App.css`, `src/assets/*`, `public/icons.svg`, `frontend/README.md`, and the page title "frontend".
- Checklist: leftovers from earlier sprints were already removed, the secret scan of files and git history found nothing, both `.env.example` files exist, and every data page has "Try again". The README and the React Flow decision in this log were not done.

**What was generated**
- `MapView.tsx` uses the stored position only. `STATUS_LABELS` moved to `features/items/types.ts`. Title "Your projects", no template tag on cards, delete message without tasks, `index.html` title "PLANter", `env.ts` comment rewritten, boilerplate files removed.
- `projectIdParamSchema` moved to `schemas/projects.ts`. `"engines": { "node": "26.x" }` in `backend/package.json` (Heroku's changelog lists Node 26 builds).
- `README.md`: tech stack, install, configure (all env variables and where to find them), Supabase setup, migrations, run, scripts, deploy (Heroku with `git subtree`, Vercel), security check, and the existing test database section.

**What went wrong or is still open**
- My checkmarks in the pasted issue list did not come through, so the AI checked every point it could from the repo instead.
- During the review the branch head moved (I was merging `feature/progressCalculation` into `dev`). The AI noticed the progress route "disappearing", checked the reflog and found nothing was lost.
- Items created before the backend start positions still sit at (0, 0) and now stack on the map. Accepted, the data is throwaway.
- Not done: the React Flow decision (mine to write), pushing and redeploying, `prisma migrate status` against Supabase, and the device and two-account checks. The AI did not run the app in a browser.
- `useProjects` still uses a different state pattern than the other hooks. Left as it is, it works.

**Insights and what I learned**
- Two pieces of code that decide the same thing (where an item goes) will drift apart. When the backend took over, the frontend fallback should have been removed in the same change.
- A deploy checklist has to compare what is deployed with what is in git, not only what works locally.

## 2026-11-02: Add item button and delete connection on the map (sprint 4)

**What I asked**
- An "Add item" button on the map, and a delete button that appears when a connection line is clicked.

**What was generated**
- `MapView.tsx`: the existing `ItemForm` and `createItem` are reused (new item gets its start position from the backend). Clicking an edge shows "A uses B" with a "Delete connection" button (with a confirm, like the item detail view); clicking the background hides it. The "No items yet" early return was removed, so the Add item button also shows on an empty map.
- No backend changes.

## 2026-11-02: Tasks API (sprint 4, Should)

**What I asked**
- Next step: the todo list, with tasks that can be connected to items. Backend first, frontend after.

**What was generated**
- `schemas/tasks.ts`, `services/tasks.ts`, `routes/tasks.ts`, wired in `app.ts`: `GET` and `POST /api/projects/:projectId/tasks`, `PATCH` and `DELETE /api/tasks/:id`. Same pattern as items: owner check in one place (`getOwnedProject` / `getOwnedTask`), 404 when not owned.
- `itemId` is checked to be in the task's project (404 otherwise), `itemId: null` unlinks. `tests/tasks.api.test.ts` (8 tests, including a two-user test and cascade on item delete).

**Decisions**
- No `sprintId` yet: it is added together with the sprint routes, where the "sprint is in the same project" check is needed.
- No migration: the `tasks` table already exists. It has no `created_at`, so the list is sorted open tasks first, then by title.

## 2026-11-02: Todo view on the project page (sprint 4, Should)

**What I asked**
- Frontend step 1 of the todo list: a Todo tab with the task list, an add form with an optional item, a done checkbox and delete.

**What was generated**
- `features/tasks/`: `types.ts`, `tasksApi.ts` (+ test), `useTasks.ts` (same pattern as `useRelationships`), `TodoView.tsx`. A fourth button "Todo" on `ProjectPage.tsx`.
- The item title is shown as text only. Delete asks for confirmation.

**Still open**
- Editing a task title, showing an item's tasks on its detail page, and sprints (step 2 and later).

## 2026-11-02: Tasks on the item detail page (sprint 4, Should)

**What I asked**
- Step 2 of the todo list: show an item's tasks on its detail page.

**What was generated**
- `tasks/ItemTasks.tsx`: list, add (linked to the item), done checkbox and delete. `ItemDetail.tsx` loads the project's tasks with `useTasks` and passes this item's tasks down, because it also needs them for the delete message.
- The item delete confirmation now counts tasks too ("This also deletes 2 connections and 1 task."), which was a TODO in the code and in `docs/todo.md`.
- In the Todo tab, the item name next to a task is a link to the item's detail page.
- No backend changes: the tasks route already returns all tasks of a project, and the page filters on `itemId`.

**Note**
- `ItemTasks` repeats some of the add, toggle and delete logic of `TodoView`. Left as it is: the two differ (item fixed vs dropdown), and a shared hook would be more code than the duplication.

## 2026-11-02: Task requirements checked, title editing (sprint 4)

**What I asked**
- I pasted the todo requirements (types, API, `useTasks`, a "Tasks" button, add, edit title, tick, delete with confirmation, errors on the form or the row, empty message). The AI compared them with what was built.

**What was missing and was added**
- The button was called "Todo", now "Tasks". Editing a title did not exist. Errors from tick and delete were shown above the list, not on the row.
- New `tasks/TaskRow.tsx`: one task with tick, edit title, delete (confirm) and its own error line. Used by both `TodoView` and `ItemTasks`, which removed the duplicated logic that I had noted earlier.

## 2026-11-03: Sprints on the Tasks tab (sprint 4, Should)

**What I asked**
- Frontend step 1 for sprints: create, rename and delete sprints, and a sprint dropdown on tasks. Keep to the code conventions, do not overengineer.

**What was generated**
- `features/sprints/`: `types.ts`, `sprintsApi.ts` (+ test), `useSprints.ts` (same pattern as `useTasks`), `SprintSection.tsx` (list, add, rename, delete with a confirmation that says how many tasks lose their sprint).
- `TodoView`: sprint dropdown in the add form, the sprint name next to a task, and `SprintSection` above the task list. `TaskRow`: sprint dropdown in the edit form.
- After a sprint is deleted, the tasks in the page state get `sprintId: null`, like the server does, so no reload is needed.

**Still open**
- Step 2: group the tasks by sprint.

## 2026-11-03: Tasks grouped by sprint (sprint 4, Should)

**What I asked**
- Step 2: group the tasks by sprint.

**What was generated**
- `TodoView`: one heading per sprint with its tasks, and a "No sprint" group last. An empty group says "No tasks." The sprint name next to a task was removed, the heading shows it now. No other changes.

## 2026-11-03: Project page layout with the File view always on the left (sprint 4, CSS)

**What I asked**
- Restyle the project page like my screenshot, keep the File view on the left on every project page (also the map), and add an Overview button in the sub header that goes back to the screenshot view.

**What was generated**
- `/projects/:projectId` is now a layout route (`pages/ProjectPage.tsx`). It loads the project, items, relationships, template and progress once and gives them to the pages through the `<Outlet context>` (`features/projects/useProjectContext.ts`). The File view sits in a sidebar, so it always matches the page next to it.
- Nested routes in `App.tsx`: overview (index), `map`, `tasks`, `progress`, `items/:itemId`. The old view buttons are now `NavLink`s in `ProjectSubHeader`, with an Overview link first and the "Add item" button on the right.
- Overview page (`ProjectOverview`): Desc (with edit and delete, moved from the old page), Tech stack, Todo and Sprint cards.
- `FileView`, `MapView` and `ItemDetail` read the shared data instead of loading their own. The add item form moved from `FileView` and `MapView` to the sub header.
- CSS modules for the new parts, dark green header and footer (`--bar-bg` in `index.css`).

**Not done**
- The Insp card from the screenshot: project inspiration has a table but no routes or UI yet.
- Not checked in a browser by the AI, only typecheck, build and tests.

**Follow-up (same day): item page CSS**
- I asked for clean, readable CSS on the item page. Generated `features/items/ItemDetail.module.css` and classNames in `ItemDetail.tsx`: three cards (the item, connections, tasks), type and MVP tags, status checkboxes shaped as pills, quieter Edit/Delete/Remove buttons. No logic changed. `ItemTasks` and `TaskRow` are shared with the Tasks page, so they are styled from the item page (`.tasks` descendant selectors) instead of being edited.
- File view page CSS: `FileView.module.css` and `ItemRowCard.module.css`. A header row (Files, item count, Add item), one card per category in a grid, items with coloured status tags (class names match the status keys, for example `styles.in_progress`), connections indented under the item. `ItemForm` is shared, so it is styled from the File view (`.addForm`). No logic changed.
- Tasks page CSS: `TodoView.module.css`, `SprintSection.module.css` and `TaskRow.module.css`. A header row with the pending count, Sprints and New task cards side by side, one card per sprint with a "done" count, the linked item as a small tag. `TaskRow` now styles itself, so the item page only styles the direct children of ItemTasks (`.tasks > ul` and so on). No logic changed.

## 2026-11-03: Groups, database and API (sprint 4, scope addition)

**What I asked**
- User-made groups of items, for example "Navigation" with the components Nav, Header and Footer. An item can be in several groups, groups have a name and a short description, and deleting a group keeps its items. Not in the original plan, so it is a scope addition.
- The AI pointed out that "category" already means the item type, so the feature is called "groups". Groups are user data like sprints, not new item types, so the Won't item "user-created item types" still holds.

**What was generated**
- Migration `groups`: tables `groups` and `group_items` (join table, many-to-many), RLS enabled on both. `group_items` has composite foreign keys `(group_id, project_id)` and `(item_id, project_id)`, so a group and an item must be in the same project. Deleting a group or an item only deletes the join rows.
- The migration was created and applied against the local test database (`DIRECT_URL` points at Supabase). I apply it to Supabase myself with `npx prisma migrate deploy`.
- `schemas/groups.ts`, `services/groups.ts`, `routes/groups.ts`: `GET`/`POST /api/projects/:projectId/groups`, `PATCH`/`DELETE /api/groups/:id`, `PUT`/`DELETE /api/groups/:id/items/:itemId`. A group is returned with `itemIds`, so item routes are unchanged. Adding the same item twice is not an error (PUT).
- `tests/groups.api.test.ts`: 8 tests, including a two-user test, an item from another project (404), and that items stay when their group is deleted.

**What went wrong**
- Typecheck failed on the first try: `description: undefined` is not allowed with `exactOptionalPropertyTypes`. Fixed with the same spread pattern as `createProject`.

**Next**
- Frontend: groups card on the Files page, group names under the item title, a Category | Group switch on the Files page, and a small group marker in the left file list.

## 2026-11-04: Groups on the Files page (sprint 4, scope addition)

**What I asked**
- Step 3 of groups: the frontend, with the same conventions as sprints, short and not overengineered.

**What was generated**
- `features/groups/`: `types.ts`, `groupsApi.ts` (+ test, 6 tests), `useGroups.ts` (same pattern as `useSprints`), `GroupSection.tsx` and its CSS module.
- `GroupSection` is a card above the category cards on the Files page: create, edit (name and description) and delete groups, and add or remove items inside each group (a select and small tags with ×). Create and edit share one small `GroupForm`. The delete confirmation says how many items stay.
- `FileView` loads the groups with `useGroups` and passes them down.
- Item add and remove is only in the group card for now (not on the item page), so there is one place to do it.

**Changed after the first version**
- The first draft had a `toInput` helper and the create form emptied itself even when the request failed. Simplified: the form only resets when the request worked.

**Not done / limits**
- Checked with typecheck, lint and tests, not in a browser (the AI cannot log in).
- Still open: group names under the item title, the Category | Group switch, and the group marker in the left file list.

## 2026-11-04: Group names under the item title (sprint 4, scope addition)

**What I asked**
- Step 4 of groups: show an item's groups as a subtitle.

**What was generated**
- `groups/itemGroups.ts`: `getGroupsOfItem(itemId, groups)`, a plain function (+ 2 tests), used by the File view and the item page.
- `ItemRow` gets a `groups` prop and shows the names as a small line under the title. `ItemDetail` loads the groups with `useGroups` and shows "Groups: Navigation, Forms" under the item title. Nothing is shown for an item in no group.
- No backend change: the groups list already has `itemIds`.

**Still open**
- Category | Group switch on the Files page, and the group marker in the left file list. Checked with typecheck, lint and tests, not in a browser.

## 2026-11-04: Category | Group switch on the Files page (sprint 4, scope addition)

**What I asked**
- Step 5 of groups: choose between the Files page grouped by category (as before) and everything grouped by group, with items in no group at the bottom and the group name as each section title.

**What was generated**
- `items/fileSections.ts`: `getFileSections(mode, items, template, groups)`, a plain function (+ 5 tests) that returns the cards for the chosen mode. Group mode: one card per group (an item in two groups shows in both), then "No group" (only when it has items). Category mode is as before, with "Unknown" for old type keys.
- `FileView`: a Category | Group switch (local state, starts on Category) and one render loop over the sections. This replaced the two copies of the card JSX (the category cards and the Unknown card). A group's description is shown under its title.
- The Groups card (create, edit, delete) stays on top in both modes.

**Still open**
- The group marker in the left file list. Checked with typecheck, lint and tests, not in a browser.

## 2026-11-04: Group names in the left file list (sprint 4, scope addition)

**What I asked**
- Step 6 of groups: a small group indication in the left file list. I accepted that it only updates with the refresh button, like the items.

**What was generated**
- `FileSidebar` loads the groups with `useGroups` and shows an item's group names as a small line under its name (one line, cut off with "..." when too long). The ↻ button now reloads items and groups.
- The sidebar already had a local variable called `groups` (the category cards), which was renamed to `categories`.

**Groups are now done** (database, API, card, subtitle, Category | Group switch, sidebar). Checked with typecheck, lint and tests, not in a browser.
- `CLAUDE.md` (data model, scope) and `docs/project-plan.md` do not mention groups yet. I decide where it belongs in MoSCoW and update them.

## 2026-11-04: Decision: groups added outside the MoSCoW plan

**Decision (mine)**
- I chose to add user-made groups even though they are not in the MoSCoW list in `docs/project-plan.md`. I see it as a very important addition to make everything work: the item types are fixed by the template, so without groups there is no way to organise items the way a project actually needs it (for example "Navigation" with a nav, a header and a footer, which are all components, or items of different types that belong together).
- The closest item in the plan is the Could item "auto-layout and grouping on the map". Groups are not that: they are not on the map, and they live in the File view. The Could item "filter in the File view" is also related but not the same. The Category | Group switch is a different way to divide the File view, not a filter.
- It is a scope addition in sprint 4, next to the Should items. It does not break any rule: groups are user data like sprints, not new item types, so the Won't item "user-created item types" still holds.

**What the AI did**
- Before building, the AI pointed out that this was outside the plan and that "category" already means the item type (so the feature is called "groups"). It gave a size estimate and split the work in six small steps. I decided to go ahead with that. The AI did not decide the scope change.

**What I did with the plan**
- `docs/project-plan.md` is not changed on purpose: it stays as the plan that was approved, and this entry is where the deviation is documented. The same goes for the thesis: the deviation and the reason are reported there.

**Cost / risk**
- Time taken from the sprint 4 Should items and the work after it (impact view and warnings in sprint 5). The cut line still applies: Could first, then search, filter, MVP marking and responsive layout. Tests and the security check are never cut, and groups have their own API tests (including a two-user test).

## 2026-11-04: Demo project seed "Awesome Demo Portfolio"

**What I asked**
- A seedable mock project, a fully planned portfolio called "Awesome Demo Portfolio", that uses every feature so I can check that everything works.

**What was generated**
- `backend/src/seed/demoPortfolio.ts`: the data only (47 items in all 9 types, 53 relationships using all 8 relationship types, 5 groups, 3 sprints, tasks linked to items, backlog tasks, item details, project inspiration). It has two deliberate gaps (a page with no connections, a function nothing triggers) for the warnings in sprint 5.
- `backend/src/seed/seedDemo.ts`: creates it for one user in one transaction. It deletes an older demo project with the same name first, so it can be repeated. Positions use the same layout function as new items.
- `backend/src/seed/run.ts` + script `npm run seed:demo -- <supabase-user-id>` (the id is checked with Zod).
- `tests/seedDemo.test.ts`: checks the data against the web template (allowed combinations, no loops, no duplicates, limits, http(s) urls) and that seeding works twice on the test database.

**Still open**
- Not run against Supabase and not looked at in the browser. I need to pick the user id of my own account.

## 2026-11-04 – 2026-11-05: Warnings (backend and frontend) and a better demo map layout

**Tool:** Claude Code (Claude Sonnet 5.5)

**What I asked:** For the sprint 5 issues, then to start with the warnings. First the backend route, then the frontend. I wanted the warnings to be very clean and not take much space: a small alert icon on the items that opens more info when pressed. Afterwards I asked for better positions of the demo items on the map (related items beside each other), and then for much more space between them so the connections are easy to see.

**What was generated:**
- **Backend:**
  - `warningRules` added to the `Template` type and the web template (plain data): a page with no component belonging to it, and a function nothing triggers.
  - `services/warnings.ts`: `findWarnings` (pure function) and `getProjectWarnings` (ownership check first, then Prisma).
  - `GET /api/projects/:id/warnings`.
  - Tests: 13 unit tests, 3 template data tests, 9 API tests including a two-user test (user B gets 404).
- **Frontend (`features/warnings/`):**
  - API function, `useWarnings` hook (same pattern as `useProgress`), a helper that groups warnings by item, and a `WarningBadge` component (a small "!" button with a popover).
  - The warnings are loaded once in `ProjectPage` and shared through the Outlet context, so the File view and the map show the same badges. They are refetched when a page link is clicked.
- **Demo seed:** every demo item got a hand-placed `col` and `row` (columns by role: tests and auth, components, pages, functions, data; rows by feature). `seedDemo.ts` multiplies them by `DEMO_COLUMN_WIDTH` (420) and `DEMO_ROW_HEIGHT` (220), which are separate from the spacing for new items. Tests check that every item has its own spot and that a component sits next to the page it belongs to.

**Decisions:**
- **Rules in the template, not in the service:** I accepted extending the template with `warningRules`, so the service never hard-codes `page` or `belongs_to` (CLAUDE.md rule) and a game template needs no code change.
- **The MVP rule skips items that are done.** The plan says "an MVP item with no tasks", but a finished item has nothing left to plan. This is one condition in `warnings.ts` and can be removed.
- **Warning errors are silent in the UI.** If the request fails, no badges are shown and no error message. Warnings are a hint, not core data, and I wanted a clean UI.
- **No new library:** the icon is a styled "!" and the popover is CSS.
- **Demo spacing is separate from new-item spacing,** so new items added by hand keep the old layout.

**What I changed or corrected:** (fill in)

**What went wrong:**
- Nothing broke in the tests (backend 195 tests, frontend 59 tests, typecheck and lint clean at the end of the session), but the AI could not look at the result in a browser. The popover position (it could overlap other nodes on the map) and the demo layout are not visually verified by the AI.
- The badges refresh only when a page link is clicked, so a connection made on the map does not remove a badge until I navigate.
- My first request to restore this log was based on an old tracked version, so entries written between `8e0d3f4` and now may be missing. This entry was written from this chat only.

## 2026-11-05: Impact view on the map

**Tool:** Claude Code (Claude Sonnet 5.5)

**What I asked:** To start the impact view (sprint 5): when I click an item on the map, its connections and connection lines should light up. Keep it simple and not overengineered.

**What was generated:** Changes in `frontend/src/features/map/MapView.tsx` only:
- A `selectedNodeId` state. Clicking a node sets it, clicking the background or a connection clears it.
- The `edges` memo styles the selected node's own connections (blue, thicker, animated) and fades the others.
- A `shownNodes` memo fades every node that is not the selected one or directly connected to it. It is applied at render time, so the saved node positions are not touched.
- Only direct connections are highlighted, not whole chains.

**Decision:** A click used to open the item's detail view. A click cannot do both, so opening the detail view moved to double-click (`onNodeDoubleClick`).

**What I changed or corrected:** Nothing yet.

**What went wrong:**
- The first version declared `shownNodes` before the `useNodesState` line that creates `nodes`, which gave a TypeScript error (variable used before its declaration). The AI moved the block below it. After that, typecheck and the 59 frontend tests passed. I have not tried it in the browser yet.
- `docs/ai-log.md` was missing on disk (it is in `.gitignore` since `8e0d3f4`). I had the AI restore the last tracked version from git (`8e0d3f4^`) and append this entry, so entries written after that commit may be missing.

## 2026-11-05: Filters on the map

**Tool:** Claude Code (Claude Sonnet 5.5)

**What I asked:** To filter the map on group, category, item type, and anything else that fits.

**What was generated:** In `frontend/src/features/map/`:
- `mapFilters.ts`: the filter type and `matchesFilters`, a plain function. An item must pass every active filter.
- `mapFilters.test.ts`: 6 Vitest tests (no filter, type, status, MVP, group, several filters together).
- `MapFilterBar.tsx`: the bar above the map with selects for type, group and status, an "MVP only" checkbox and a "Clear filters" button.
- `MapView.tsx`: holds the filter state, loads the groups, and styles matching nodes in the `shownNodes` memo.

**Decisions:**
- Category and item type are the same thing in this app (the category is fixed by the template), so there is one "Type" filter. The AI added status and "MVP only" as the extra filters.
- The first version hid items that did not match (`hidden` on the node). I asked whether that was the best way. The AI pointed out that hiding also hides the connections, so a filter on pages shows pages with no connections. I chose to switch to dimming.
- Final behaviour: nothing is hidden. Matching items get a purple outline, so the whole map and its connections stay visible. The impact view still fades unconnected nodes on click, so the two do not clash.
- Each filter takes one value. Multi-select was suggested and not built.

**What I changed or corrected:** I changed the approach from hiding to outlining after reviewing the first version.

**What went wrong:** Nothing broke. The first version was replaced because of its design, not because of a bug. Typecheck and the 65 frontend tests pass, but I have not tried the filters in the browser yet.
