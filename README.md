# PLANter

A visual planning tool for code projects: a "game design document for websites and apps". A project is broken down into items (pages, components, functions, data, design, assets, authentication, testing, tech stack) that are connected with typed relationships. The project is shown as a File view (items grouped by category), as an interactive relationship map, and as a progress overview.

Thesis project (examensarbete). The full plan is in `docs/project-plan.md`, and the rules for the code are in `CLAUDE.md`.

## Tech stack

| Part | Technology | Hosted on |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, React Flow (`@xyflow/react`), React Router | Vercel |
| Backend | Node.js, Express 5, TypeScript, Zod, Prisma | Heroku |
| Database and login | Supabase (PostgreSQL, Auth, Row Level Security) | Supabase |
| Tests | Vitest, Supertest, local PostgreSQL (Postgres.app) | |

```
React (Vercel) --login/register/logout--> Supabase Auth
React --API requests + token--> Express (Heroku) --Prisma--> Supabase PostgreSQL
```

The frontend only uses Supabase for login. All data goes through the Express API, which checks the token, validates the input with Zod and checks that the user owns the data.

## Project structure

```
frontend/   React app (Vite)
backend/    Express API, Prisma schema and migrations, tests
```

## Requirements

- Node.js 26 (the backend pins `"node": "26.x"` in `package.json`)
- A Supabase project
- Postgres.app (macOS) for the backend tests, see [Test database](#test-database-local-postgres)

## Install

```
git clone <repo url>
cd PLANter
cd backend && npm install
cd ../frontend && npm install
```

`npm install` in `backend/` does not generate the Prisma client. Run `npx prisma generate` in `backend/` once (and again after every change in `prisma/schema.prisma`).

## Configure

Copy the example files and fill in the values. `.env` files are never committed.

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend (`backend/.env`)

| Variable | What it is | Where to find it |
| --- | --- | --- |
| `DATABASE_URL` | Pooled connection string, used by the running app | Supabase: **Connect** → connection pooler |
| `DIRECT_URL` | Direct connection string, used by the Prisma CLI for migrations | Supabase: **Connect** → direct connection |
| `SUPABASE_URL` | The project URL | Supabase: **Project Settings → API** |
| `SUPABASE_SERVICE_ROLE_KEY` | Used to verify login tokens. Bypasses Row Level Security, so it must only ever be in the backend | Supabase: **Project Settings → API** |
| `FRONTEND_URL` | The only origin allowed by CORS. Exact match, no trailing slash | `http://localhost:5173` locally, the Vercel URL in production |
| `PORT` | Port of the API (default 3000). Heroku sets it itself | |

The backend checks these with Zod at startup (`backend/src/config/env.ts`) and stops with a list of what is missing.

### Frontend (`frontend/.env`)

| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | The Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The anon (public) key. **Never** the service role key |
| `VITE_API_URL` | URL of the backend without a trailing slash, for example `http://localhost:3000` |

Everything that starts with `VITE_` is built into the JavaScript bundle and is public. Secrets never go in a `VITE_` variable.

### Supabase

1. Create a project.
2. Apply the database migrations (next section).
3. **Authentication → URL Configuration:** set the Site URL to the frontend URL, and add it to Redirect URLs (both `http://localhost:5173` and the Vercel URL).
4. Email confirmation can be on or off. When it is on, Register shows "Check your email" until the link is clicked.
5. **Storage → New bucket:** create a bucket named `inspiration-images` with **Public bucket turned off**. The inspiration images are stored there. Without this bucket, uploading an image fails. Only the backend (with the service role key) can read and write it, and it hands out links that stop working after an hour.

## Database migrations

The schema is in `backend/prisma/schema.prisma` and the migrations are in `backend/prisma/migrations/`. To apply all migrations to the database in `DIRECT_URL` (Supabase):

```
cd backend
npx prisma migrate status   # which migrations are applied
npx prisma migrate deploy   # apply the missing ones
```

Every migration that creates a table must also enable Row Level Security on it (`CLAUDE.md`, rule 5):

1. `npx prisma migrate dev --create-only --name <name>`
2. Add `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` at the end of the new `migration.sql`
3. `npx prisma migrate dev`, then `npm run test:db:migrate`
4. Run the RLS check in [Security check](#security-check)

## Run locally

Two terminals:

```
cd backend && npm run dev     # http://localhost:3000, GET /health returns { "status": "ok" }
cd frontend && npm run dev    # http://localhost:5173
```

## Demo project

The repo includes demo data: a fully planned portfolio website called **Awesome Demo Portfolio**. It uses every item type, every relationship type and all three statuses, and has groups, sprints, tasks, item details and project inspiration, so it is a quick way to see (and test) every part of PLANter without planning a project first. The data is in `backend/src/seed/demoPortfolio.ts`.

1. Follow Install, Configure and Database migrations above, then start the app ([Run locally](#run-locally)).
2. Register an account in the app and log in once. The demo project is created for that account.
3. Find the id of your account: Supabase → **Authentication → Users** → copy the **User UID**.
4. Seed it:

   ```
   cd backend
   npm run seed:demo -- <your-user-uid>
   ```

5. Reload the app. "Awesome Demo Portfolio" is in your project list.

Notes:

- The seed writes to the database in `DATABASE_URL` (in `backend/.env`), so check that it points where you expect.
- It only touches your own demo project: running it again deletes and recreates the project with this name for that user, and nothing else. A project you made yourself with the same name would also be replaced, so rename it first.
- The data includes two deliberate gaps (a page with no connections and a function nothing triggers), so they can be used to test warnings.

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `backend/` | `npm run dev` | Starts the API and restarts it on changes |
| `backend/` | `npm test` | Runs the tests against the local test database |
| `backend/` | `npm run typecheck` | TypeScript check of `src`, tests and configs |
| `backend/` | `npm run build` | `prisma generate` and compiles `src` to `dist` |
| `backend/` | `npm start` | Runs the compiled server (used by Heroku) |
| `backend/` | `npm run seed:demo -- <user-id>` | Creates (or recreates) the demo project "Awesome Demo Portfolio" for that user, see [Demo project](#demo-project) |
| `backend/` | `npm run test:db:migrate` | Applies all migrations to the local `planter_test` database |
| `frontend/` | `npm run dev` | Starts Vite |
| `frontend/` | `npm test` | Runs the frontend tests |
| `frontend/` | `npm run lint` | ESLint |
| `frontend/` | `npm run build` | Type check and production build to `dist` |

## Deploy

### Backend (Heroku)

Heroku gets only the `backend/` folder, sent with `git subtree` from the repo root.

1. Set the config vars before the first build (`prisma generate` needs `DIRECT_URL`): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (the Vercel URL). Heroku sets `PORT` itself.

   ```
   heroku config:set FRONTEND_URL=https://<your-app>.vercel.app
   ```

2. Push the backend of the local `dev` branch to Heroku's `main`:

   ```
   git subtree push --prefix backend heroku dev:main
   ```

   Heroku runs `npm run build` and then `npm start`.
3. Check it: `heroku logs --tail`, and open `https://<heroku app url>/health`. The real app URL (with its suffix) is shown by `heroku info`.

Migrations are not run by the deploy. Apply new ones with `npx prisma migrate deploy` before pushing code that needs them.

### Frontend (Vercel)

1. Import the repository in Vercel. Root Directory: `frontend`. Framework preset: Vite.
2. Add the three `VITE_` variables before the first build. A change in them needs a new deploy, because they are built into the bundle.
3. `frontend/vercel.json` sends every path to `index.html`, so reloading a page like `/projects/<id>` works.
4. Vercel builds the branch set as Production Branch (**Settings → Git**) on every push.

After the first deploy, set `FRONTEND_URL` on Heroku to the Vercel URL, and add the Vercel URL in Supabase (Site URL and Redirect URLs).

## Security check

- Row Level Security is on for every table. This SQL (Supabase SQL editor) must return no rows:

  ```sql
  select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
  ```

- A Data API request with the anon key returns no data (an empty list or a permission error):

  ```
  curl "https://<project>.supabase.co/rest/v1/projects" -H "apikey: <anon key>"
  ```

- The Storage bucket `inspiration-images` is private (Supabase → Storage: the bucket must not say "Public"). Opening an image URL without a signature must fail.

- Every API route except `/health` requires a valid token, and data that belongs to another user gives 404. The backend tests check this with two users.

## Test database (local Postgres)

### Why

The backend tests (`cd backend && npm test`) run against a real PostgreSQL database, so they test the whole chain: routes, Zod, ownership checks, Prisma and the database constraints. They delete rows between tests, so they must **never** run against Supabase. A local database is safe to wipe and needs no internet.

Supabase Auth is the only thing that is mocked in the tests (fake users and tokens).

### What to download

[Postgres.app](https://postgresapp.com/) (macOS). It is a normal Mac app that runs PostgreSQL on port 5432. Download it, move it to `/Applications` and open it.

### One-time setup

1. Open Postgres.app and click **Initialize** (or **Start**) so a server is running on port 5432.
2. Create the test database. Either double-click a database in the Postgres.app window to open `psql`, or run:

   ```
   /Applications/Postgres.app/Contents/Versions/latest/bin/psql -U postgres -h localhost -c "CREATE DATABASE planter_test;"
   ```

   (Optional: add `/Applications/Postgres.app/Contents/Versions/latest/bin` to your `PATH` so `psql` works everywhere.)
3. Apply the migrations to it:

   ```
   cd backend
   npm run test:db:migrate
   ```

4. Run the tests:

   ```
   npm test
   ```

### Every time

- Postgres.app must be **running** (the elephant icon is in the menu bar). If it is not, the tests fail with a connection error.
- After every new Prisma migration, run `npm run test:db:migrate` again.
- After every change in `prisma/schema.prisma`, run `npx prisma generate`. An old generated client causes strange errors (for example "Unknown argument `description`").

### Where things are

| What | Where |
| --- | --- |
| Connection string for tests | `backend/vitest.config.ts`: `postgresql://postgres@localhost:5432/planter_test` (not a secret, no password) |
| Safety guard | `backend/tests/setup.ts` stops all tests if `DATABASE_URL` does not contain `localhost` |
| Migrations | `backend/prisma/migrations/` |
| Migrate script | `test:db:migrate` in `backend/package.json` |

The test connection string is set in `vitest.config.ts`, so your real `.env` (which points at Supabase) is not used by the tests and does not need to change.

### Look at the data or reset it

- Open the database in the Postgres.app window (double-click `planter_test`), or run `psql -U postgres -h localhost planter_test`.
- Full reset: `DROP DATABASE planter_test;`, create it again and run `npm run test:db:migrate`.

### Problems

- `ECONNREFUSED` or "connection refused": Postgres.app is not running.
- `database "planter_test" does not exist`: do step 2 again.
- `relation ... does not exist` or missing columns: run `npm run test:db:migrate`.
- "Tests must use the local test database": `DATABASE_URL` does not point at localhost. Do not work around this, it protects the Supabase data.
