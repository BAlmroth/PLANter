# PLANter

A visual planning tool for code projects. See `CLAUDE.md` and `docs/project-plan.md` for what it is.

> This README only covers the test database for now. Install, configure and run instructions for the whole project are added later (sprint 5).

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
