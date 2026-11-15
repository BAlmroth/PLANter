# PLANter

A visual planning tool for code projects for websites, apps and games. A project is broken down into items (for a website: pages, components, functions, data, design, assets, security, testing, tech stack) that are connected with typed relationships. The project is shown as a File view (items grouped by category), as an interactive relationship map, and as a progress overview.

**Contents**

- [Features](#features) · [Tech stack](#tech-stack)
- [Installation guide](#installation-guide): get PLANter running on your computer, step by step
- [Run the tests](#run-the-tests): set up the local test database (macOS, Windows, Linux)
- [Demo projects](#demo-projects) · [Scripts](#scripts) · [Database migrations](#database-migrations) · [Deploy](#deploy) · [Security check](#security-check)
- [Troubleshooting](#troubleshooting)

## Features

- Register, log in and log out (Supabase Auth). Every user only sees their own projects.
- Projects with a template, chosen when the project is created, plus a description and a color palette. Two templates:
  - **Web**: pages, components, functionality, data, design, assets, security, tests and tech stack.
  - **Game**: mechanics, story, characters, locations, quests, abilities, inventory, screens & UI, art, audio, playtests and engine & tools. Sub-kinds like enemies, weapons or currencies are groups.
- Items in the template's categories with a status (planned, in progress, done), an MVP flag, a main photo and a moodboard of links, images and colors.
- Typed connections between items, checked against rules in the template (web: "part of", "triggers", "uses", "reads from", "protects", "tests" and more; game: "unlocks", "made from", "costs", "upgrades to", "appears in" and more). Circular connections are rejected where they make no sense, which in a game catches progression soft-locks ("the key is behind the door it opens").
- Game projects: amounts on recipes and prices ("made from 20 × Wood", "costs 500 × Gold"), and a Requirements card on the item page that shows what it takes to get an item (made from, costs, unlocked by, and free-text conditions like "only in summer").
- Three ways to look at a project: the File view (items grouped by category), the relationship map (React Flow, create items and connections and save positions) and an overview.
- Groups of items, project inspiration (links, text, images), search and filters.
- Tasks and sprints, with a board (planned, in progress, done).
- Progress per category and in total, warnings for things that are easy to forget, and a project checklist.
- Help for beginners: a short tutorial on every page and a `/help` page that shows the categories and connections of the project's template.

## Tech stack

| Part | Technology | Hosted on |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, React Flow (`@xyflow/react`), React Router | Vercel |
| Backend | Node.js, Express 5, TypeScript, Zod, Prisma | Heroku |
| Database and login | Supabase (PostgreSQL, Auth, Storage, Row Level Security) | Supabase |
| Tests | Vitest, Supertest, a local PostgreSQL | your computer |

```
React (Vercel) --login/register/logout--> Supabase Auth
React --API requests + token--> Express (Heroku) --Prisma--> Supabase PostgreSQL
```

The frontend only uses Supabase for login. All data goes through the Express API, which checks the token, validates the input with Zod and checks that the user owns the data.

```
frontend/   React app (Vite)
backend/    Express API, Prisma schema and migrations, tests
```

---

## Installation guide

Follow the steps in order. Each step ends with a **✅ Check** so you know it worked before you go on. It takes about 20 minutes.

> **Commands:** run them in a terminal (macOS/Linux: Terminal, Windows: PowerShell). When a step says "in `backend/`", first go to that folder with `cd`. Where Windows needs a different command, it is shown separately.

### Step 1: Install the tools

You need:

1. **Git**: [git-scm.com/downloads](https://git-scm.com/downloads) (already installed on most Macs).
2. **Node.js version 26**: [nodejs.org](https://nodejs.org/). The backend requires 26 (`"node": "26.x"` in `backend/package.json`). `npm` comes with Node.

**✅ Check:**

```
git --version
node -v
```

`node -v` must print `v26.` followed by any numbers.

### Step 2: Download the code

```
git clone https://github.com/BAlmroth/PLANter.git
cd PLANter
```

**✅ Check:** the `PLANter` folder has a `frontend` and a `backend` folder.

### Step 3: Install the packages

From the `PLANter` folder, one command at a time:

```
cd backend
npm install
cd ../frontend
npm install
cd ..
```

**✅ Check:** both `backend/` and `frontend/` now have a `node_modules` folder, and `npm install` did not end with `ERR!`.

### Step 4: Create a Supabase project

Supabase holds the database, the logins and the uploaded images.

1. Create a free account at [supabase.com](https://supabase.com/) and click **New project**.
2. Choose a name and a **database password**. Write the password down: you need it in step 5, and Supabase does not show it again.
3. Wait until the project is ready (a minute or two).
4. **Create the image bucket:** go to **Storage → New bucket**.
   - Name: `inspiration-images` (exactly this)
   - **Public bucket: off**
   
   All images are stored here (project inspiration, the main photo of an item, moodboard images). Without the bucket, uploading an image fails. Only the backend can read and write it.
5. **Set the login URLs:** go to **Authentication → URL Configuration**.
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** add `http://localhost:5173/**` (the `/**` lets the "Forgot password" email link open the `/reset-password` page)
6. (Optional) Email confirmation: under **Authentication → Sign In / Providers → Email** you can turn **Confirm email** on or off. When it is on, you must click the link in the email before you can log in.

**✅ Check:** the Storage page shows `inspiration-images` **without** a "Public" label.

### Step 5: Create the `.env` files

The `.env` files hold the addresses and keys the app needs. They are secret and are never committed to git. Start by copying the examples.

macOS / Linux (from the `PLANter` folder):

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Windows (PowerShell, from the `PLANter` folder):

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Now open both files in your editor and fill in the values.

#### `backend/.env`

In Supabase, click the **Connect** button at the top of the project page to find the connection strings.

| Variable | What to write | Where to find it |
| --- | --- | --- |
| `DATABASE_URL` | The **Transaction pooler** string (port `6543`), with `?pgbouncer=true` added at the end | **Connect** → Transaction pooler |
| `DIRECT_URL` | The **Session pooler** string (port `5432`) | **Connect** → Session pooler |
| `SUPABASE_URL` | The project URL, like `https://abcdefgh.supabase.co` | **Project Settings → API** (or **Data API**) |
| `SUPABASE_SERVICE_ROLE_KEY` | The `service_role` key (secret) | **Project Settings → API Keys** |
| `FRONTEND_URL` | `http://localhost:5173` (already filled in). No `/` at the end | |
| `PORT` | `3000` (already filled in) | |
| `TEST_DATABASE_URL` | Leave empty for now. Only needed for the tests, see [Run the tests](#run-the-tests) | |

In both connection strings, **replace `[YOUR-PASSWORD]`** with the database password from step 4 (remove the brackets too). Example of the finished lines:

```
DATABASE_URL=postgresql://postgres.abcdefgh:MyPassword@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abcdefgh:MyPassword@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

> Why two strings? The running app uses the transaction pooler (many short connections). Prisma's migrations need a session connection, which the session pooler gives. Supabase's "Direct connection" only works on networks with IPv6, so the session pooler is the safe choice.

The `service_role` key can read and write everything, so it only ever goes in `backend/.env`, never in the frontend.

#### `frontend/.env`

| Variable | What to write | Where to find it |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | The same project URL as `SUPABASE_URL` | **Project Settings → API** |
| `VITE_SUPABASE_ANON_KEY` | The `anon` / public key. **Never** the service role key | **Project Settings → API Keys** |
| `VITE_API_URL` | `http://localhost:3000` (no `/` at the end) | |

Everything that starts with `VITE_` is built into the website's JavaScript and is public. That is why the frontend only gets the public `anon` key.

**✅ Check:** no line in either file ends with `=` and nothing after it, except `TEST_DATABASE_URL`. No `[YOUR-PASSWORD]` is left.

### Step 6: Set up the database

In `backend/`, run these two commands:

```
cd backend
npx prisma generate
npx prisma migrate deploy
```

- `npx prisma generate` creates the database code the backend uses (in `backend/src/generated/`, not in git). It reads `DIRECT_URL`, so it only works after step 5.
- `npx prisma migrate deploy` creates all the tables in your Supabase database, with Row Level Security turned on for every table.

**✅ Check:** `migrate deploy` ends with **"All migrations have been successfully applied."** In Supabase, **Table Editor** now shows tables like `projects` and `items`.

### Step 7: Start the app

You need **two terminals** open at the same time, one for the backend and one for the frontend.

Terminal 1 (backend):

```
cd backend
npm run dev
```

Terminal 2 (frontend):

```
cd frontend
npm run dev
```

**✅ Check:**

- Open [http://localhost:3000/health](http://localhost:3000/health). It shows `{"status":"ok"}`.
- Open [http://localhost:5173](http://localhost:5173). The PLANter login page is shown.

If the backend stops with "Missing or invalid environment variables", the list under it tells you which line in `backend/.env` is wrong.

### Step 8: Create an account

1. On [http://localhost:5173](http://localhost:5173), click **Register**, fill in an email and a password and click **Create account**.
2. If email confirmation is on (step 4.6), click the link in the email first.
3. Log in and create your first project.

**✅ Check:** the new project is in your project list, and it is still there after reloading the page.

PLANter is now installed. 🎉 Next, you can [add the demo projects](#demo-projects) to see every feature with real data, or [set up the tests](#run-the-tests).

To start the app again later, you only need step 7.

---

## Run the tests

The backend tests run against a **real PostgreSQL database on your own computer**, so they test the whole chain: routes, Zod, ownership checks, Prisma and the database constraints. They delete data between tests, so they must **never** run against Supabase. A safety guard stops them if the database is not on `localhost`. Supabase Auth is the only thing that is faked in the tests.

The frontend tests need no database.

### Frontend tests (no setup)

```
cd frontend
npm test
```

### Backend tests: one-time setup

Do steps 1 to 6 of the [Installation guide](#installation-guide) first. Then follow the steps for your system.

#### T1. Install and start PostgreSQL

**macOS:**

1. Download [Postgres.app](https://postgresapp.com/), move it to **Applications** and open it.
2. Click **Initialize**. The server now runs on port 5432, and an elephant icon is in the menu bar.
3. The user is `postgres` and there is **no password**.

**Windows:**

1. Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) and run it.
2. Keep the default port **5432**.
3. Choose a password for the `postgres` user and **write it down**. Use only letters and numbers: characters like `@`, `:` or `/` break the connection string.
4. PostgreSQL now runs in the background and starts with the computer.

**Linux (Debian/Ubuntu):**

```
sudo apt install postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

The second command gives the `postgres` user the password `postgres`. PostgreSQL starts by itself.

#### T2. Create the test database

The database must be called `planter_test`.

**macOS:**

```
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -U postgres -h localhost -c "CREATE DATABASE planter_test;"
```

**Windows:**

1. Open **SQL Shell (psql)** from the Start menu.
2. Press **Enter** four times to accept the defaults (Server, Database, Port, Username).
3. Type your password and press **Enter** (nothing is shown while you type, that is normal).
4. Type `CREATE DATABASE planter_test;` and press **Enter**.

(Or use pgAdmin, which comes with the installer: right-click **Databases → Create → Database**.)

**Linux:**

```
sudo -u postgres createdb planter_test
```

**✅ Check:** the command printed `CREATE DATABASE` (on Linux it prints nothing, which means it worked).

#### T3. Tell the tests your password (Windows and Linux only)

**macOS with Postgres.app: skip this step.** Without a password, the tests use `postgresql://postgres@localhost:5432/planter_test` by themselves.

Windows and Linux: open `backend/.env` and fill in `TEST_DATABASE_URL`, with your password instead of `YOUR_PASSWORD`:

```
TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/planter_test
```

(On Linux with the command from T1, the password is `postgres`.) Write `localhost`, not `127.0.0.1`: the safety guard only accepts `localhost`.

This is the only line from `.env` the tests use. Your Supabase values stay as they are and are never touched by the tests.

#### T4. Create the tables in the test database

```
cd backend
npm run test:db:migrate
```

**✅ Check:** it ends with **"All migrations have been successfully applied."**

#### T5. Run the tests

```
npm test
```

**✅ Check:** the summary says every test file **passed**.

### Backend tests: every time

- PostgreSQL must be running (macOS: open Postgres.app. Windows and Linux: it runs by itself).
- After pulling a new migration, run `npm run test:db:migrate` again.
- After a change in `prisma/schema.prisma`, run `npx prisma generate` again.

### Look at the test data or start over

- **Look:** macOS: double-click `planter_test` in Postgres.app. Windows: pgAdmin or SQL Shell (psql). Any system: `psql -U postgres -h localhost planter_test`.
- **Start over:** run `DROP DATABASE planter_test;`, then do T2 and T4 again.

### How it works

| What | Where |
| --- | --- |
| Which database the tests use | `backend/tests/testDatabaseUrl.ts`: `TEST_DATABASE_URL` from the terminal, then from `backend/.env`, otherwise `postgresql://postgres@localhost:5432/planter_test` |
| Test settings | `backend/vitest.config.ts` sets `DATABASE_URL` to that address for the tests |
| Safety guards | `backend/tests/setup.ts` stops all tests, and `backend/tests/migrateTestDb.ts` stops the migration, if the address does not contain `localhost` |
| Migrate script | `npm run test:db:migrate` runs `backend/tests/migrateTestDb.ts` (a Node script, so it works on Windows too) |

---

## Demo projects

The repo includes demo data for both templates. It is a quick way to see (and test) every part of PLANter without planning a project first.

- **Awesome Demo Portfolio** (web): a fully planned portfolio website. It uses every item type, every relationship type and all three statuses, and has groups, sprints, tasks, item details and project inspiration. Data: `backend/src/seed/demoPortfolio.ts`.
- **Emerald Brew** (game): a small cozy game about mixing ingredients into new items. 25 items that use every game category and every connection type, with recipes and prices with amounts, an upgrade, "unlocked by" and a condition. Open "Emerald tea" or "Cottage, level 2" to see the Requirements card. The Moodboard page has a palette, mood images and notes, and links to games to learn from. Data: `backend/src/seed/demoGame.ts`.

Both demos have a color palette (linked to items) and images: main photos on some items, a sketch on an item's moodboard and an image on the Moodboard page. The images are in `backend/src/seed/images/` (small pixel-art and wireframe PNGs made for the demo). Replace a file with your own JPEG, PNG or WebP under the same name to use your own images.

### Add the demos

1. Finish the [Installation guide](#installation-guide), including step 8 (an account you have logged in with).
2. Find the id of your account: Supabase → **Authentication → Users** → click your user → copy the **User UID**.
3. In `backend/`, run one of these, with your UID instead of `<your-user-uid>`:

   ```
   cd backend
   npm run seed:demo -- <your-user-uid>         # both demos
   npm run seed:demo -- <your-user-uid> web     # only the web demo
   npm run seed:demo -- <your-user-uid> game    # only the game demo
   ```

4. Reload the app.

**✅ Check:** "Awesome Demo Portfolio" and "Emerald Brew" are in your project list.

Good to know:

- The seed writes to the database in `DATABASE_URL` and uploads the images to the bucket `inspiration-images` in `SUPABASE_URL` (both in `backend/.env`). Running it again also deletes the old demo's image files, like deleting a project does.
- It only touches your own demo projects: running it again deletes and recreates the projects with these names for that user, and nothing else (seeding only the game demo leaves the web demo alone, and the other way round). Each demo is saved in its own transaction, so if the second one fails, the first one is already there and the command can simply be run again. A project you made yourself with the same name would also be replaced, so rename it first.
- The web demo has two deliberate gaps (a page with no connections and a function nothing triggers), so you can see the warnings. The game demo has no warnings.

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `backend/` | `npm run dev` | Starts the API and restarts it on changes |
| `backend/` | `npm test` | Runs the tests against the local test database |
| `backend/` | `npm run test:db:migrate` | Creates or updates the tables in the local `planter_test` database |
| `backend/` | `npm run typecheck` | TypeScript check of `src`, tests and configs |
| `backend/` | `npm run build` | `prisma generate` and compiles `src` to `dist` |
| `backend/` | `npm start` | Runs the compiled server (used by Heroku) |
| `backend/` | `npm run seed:demo -- <user-id> [web\|game]` | Creates (or recreates) the demo projects for that user. See [Demo projects](#demo-projects) |
| `backend/` | `npx prisma generate` | Creates the database code from `prisma/schema.prisma` |
| `backend/` | `npx prisma migrate deploy` | Applies new migrations to the Supabase database |
| `frontend/` | `npm run dev` | Starts Vite |
| `frontend/` | `npm test` | Runs the frontend tests |
| `frontend/` | `npm run lint` | ESLint |
| `frontend/` | `npm run build` | Type check and production build to `dist` |

## Database migrations

The schema is in `backend/prisma/schema.prisma` and the migrations are in `backend/prisma/migrations/`.

**After pulling new code** that has new migrations:

```
cd backend
npx prisma generate          # update the database code
npx prisma migrate status    # see which migrations are missing
npx prisma migrate deploy    # apply them to Supabase
npm run test:db:migrate      # apply them to the test database
```

**When you create a migration** with a new table, it must also turn on Row Level Security for that table (`CLAUDE.md`, rule 5):

1. `npx prisma migrate dev --create-only --name <name>`
2. Add `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` at the end of the new `migration.sql`
3. `npx prisma migrate dev`, then `npm run test:db:migrate`
4. Run the RLS check in [Security check](#security-check)

## Deploy

The deployed app is always the `main` branch. Work happens on `dev` (and feature branches), and is merged into `main` (with a pull request) when it is ready to go live. Both the backend and the frontend are deployed from `main`.

### Backend (Heroku)

Heroku gets only the `backend/` folder, sent with `git subtree` from the repo root.

1. Set the config vars before the first build (`prisma generate` needs `DIRECT_URL`): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (the Vercel URL). Heroku sets `PORT` itself.

   ```
   heroku config:set FRONTEND_URL=https://<your-app>.vercel.app
   ```

2. Push the backend of the local `main` branch to Heroku's `main` (pull first, so it has the merged changes):

   ```
   git checkout main
   git pull
   git subtree push --prefix backend heroku main
   ```

   Heroku runs `npm run build` and then `npm start`.
3. Check it: `heroku logs --tail`, and open `https://<heroku app url>/health`. The real app URL (with its suffix) is shown by `heroku info`.

Migrations are not run by the deploy. Apply new ones with `npx prisma migrate deploy` before pushing code that needs them.

### Frontend (Vercel)

1. Import the repository in Vercel. Root Directory: `frontend`. Framework preset: Vite.
2. Add the three `VITE_` variables before the first build. A change in them needs a new deploy, because they are built into the bundle.
3. `frontend/vercel.json` sends every path to `index.html`, so reloading a page like `/projects/<id>` works.
4. Set the Production Branch to `main` (**Settings → Git**). Vercel deploys `main` to production on every push, and builds other branches (like `dev`) only as previews.

After the first deploy, set `FRONTEND_URL` on Heroku to the Vercel URL, and add the Vercel URL in Supabase (**Authentication → URL Configuration**: Site URL, and `https://<your-app>.vercel.app/**` in Redirect URLs).

## Security check

- Row Level Security is on for every table. This SQL (Supabase **SQL Editor**) must return no rows:

  ```sql
  select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
  ```

- A Data API request with the anon key returns no data (an empty list or a permission error):

  ```
  curl "https://<project>.supabase.co/rest/v1/projects" -H "apikey: <anon key>"
  ```

- The Storage bucket `inspiration-images` is private (Supabase → Storage: the bucket must not say "Public"). Opening an image URL without a signature must fail.

- Every API route except `/health` requires a valid token, and data that belongs to another user gives 404. The backend tests check this with two users.

## Troubleshooting

### Installing and running

| Problem | Fix |
| --- | --- |
| `npm install` warns about the Node version (`EBADENGINE`) | Install Node.js 26 (step 1) |
| `npx prisma generate` says "Cannot resolve environment variable: DIRECT_URL" | `backend/.env` is missing or `DIRECT_URL` is empty (step 5) |
| `prisma migrate deploy` says "Authentication failed" (`P1000`) | Wrong database password in `DIRECT_URL`, or `[YOUR-PASSWORD]` is still there |
| `prisma migrate deploy` says "Can't reach database server" (`P1001`) | Use the **Session pooler** string for `DIRECT_URL`, not "Direct connection" |
| Backend stops with "Missing or invalid environment variables" | Fix the lines it lists in `backend/.env` |
| Backend crashes with "Cannot find module ... generated/prisma" | Run `npx prisma generate` in `backend/` |
| Login page shows an error or nothing happens on Register | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then restart `npm run dev` in `frontend/` (Vite only reads `.env` at start) |
| Logged in, but projects fail to load ("Failed to fetch" or a CORS error in the browser console) | The backend is not running, `VITE_API_URL` is wrong, or `FRONTEND_URL` is not exactly `http://localhost:5173` |
| The "Forgot password" email link opens the start page instead of "Reset password" | Add `http://localhost:5173/**` to Redirect URLs (step 4) |
| Image upload fails | The bucket `inspiration-images` is missing or misspelled (step 4) |
| Strange errors like "Unknown argument `description`" | The database code is old: run `npx prisma generate` |

### Backend tests

| Problem | Fix |
| --- | --- |
| `ECONNREFUSED` or "connection refused" | PostgreSQL is not running (macOS: open Postgres.app) |
| `password authentication failed for user "postgres"` or `P1000` | Set `TEST_DATABASE_URL` with the right password (T3) |
| `database "planter_test" does not exist` | Do T2 again |
| `relation ... does not exist` or missing columns | Run `npm run test:db:migrate` (T4) |
| "Tests must use the local test database" or "TEST_DATABASE_URL must point at localhost" | The address must use `localhost`. Do not work around this: it protects your Supabase data |
