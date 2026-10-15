# PLANter

PLANter is a visual planning tool for code projects: a "game design document for websites and apps". A project is broken down into items (pages, components, functions, data, design, assets, authentication, testing, tech stack, MVP) that are connected with typed relationships ("belongs to", "triggers", "uses", "depends on"). The project can be viewed as a File view (items grouped by category) and as an interactive relationship map (React Flow). Both views are equally important. There is also a progress overview and, later, a todo list with sprints.

This is a thesis project (examensarbete) for a web developer education. Full plan: `docs/project-plan.md`.

## How to work with me

- I am a student and I need to understand every line that goes into the project. Work in small steps, explain new concepts briefly (React Flow, Zod, Prisma, Row Level Security, middleware), and do not generate large amounts of code at once.
- If something in my plan is unclear, wrong or risky, say so before building it.
- Do not add features, libraries or tools that are not in this file or in the plan without asking first. This includes state management, UI and CSS.
- All AI use must be documented for the thesis. After a significant session, add an entry to `docs/ai-log.md`: date, what I asked, what was generated, what I changed or corrected, and anything that went wrong.

## Tech stack

- Frontend: React + TypeScript (Vite), React Flow (`@xyflow/react`) for the relationship map
- Backend: Node.js + Express + TypeScript
- Validation: Zod (requests, item shapes, relationship rules)
- Database access: Prisma (schema, migrations, typed queries)
- Database and services: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- Tests: Vitest (frontend and backend), Supertest for API tests
- Hosting: Vercel (frontend), Heroku (backend). Backup: Render or Railway
- Design: Figma
- One GitHub repo with `frontend/` and `backend/`

## Architecture

```
React (Vercel) --login/register/logout--> Supabase Auth
React <--------session token (JWT)------- Supabase Auth
React --API requests + token--> Express (Heroku)
Express: verify token -> Zod validation -> ownership check -> logic -> Prisma
Prisma --> Supabase PostgreSQL (RLS, constraints)
```

Login, registration and logout are done in the frontend directly against Supabase Auth. Everything else goes through Express.

### Rules that must not be broken

1. The frontend never reads or writes the database directly. Only Supabase Auth (and possibly Storage) is used from the frontend. All data goes through the Express API.
2. Every API route except a health check uses the `requireAuth` middleware. The user id comes from the verified token, never from the request body.
3. Prisma connects directly to Postgres and bypasses Row Level Security. Therefore every route that touches a project, item, relationship, task or sprint must check that the logged-in user owns it, using one shared helper. When a user does not own a resource, respond as if it does not exist (404).
4. All input is validated with Zod before it is used. Schemas live in `backend/src/schemas/`.
5. Row Level Security is enabled on every table in `public` (including Prisma's `_prisma_migrations`) with no policies (deny-all), as a safety net: the Supabase Data API can neither read nor write any table, only Express through Prisma can. Never disable it, and every migration that creates a table must also enable RLS on it. This differs on purpose from the original plan (ownership policies), see `docs/ai-log.md` (2026-10-15).
6. Secrets only in environment variables. The Supabase service role key and any AI API key exist only in the backend. Never put secrets in variables starting with `VITE_`.
7. Do not write own cryptography. Password handling stays in Supabase Auth.

### Templates and relationship rules

- Item types and relationship types come from a template. A template is defined in code in `backend/src/templates/` (for example `web.ts`): a list of item types, relationship types and which combinations are allowed. A project stores its template key (for example `"web"`).
- Never hard-code item types or relationship rules in route logic. Read them from the template.
- To create a relationship: look up the type of the source and target items in the database, then check with Zod and the template that the combination is allowed.
- Never take `projectId` from the request body for relationships. Load both items in one query filtered on the owner (`project: { userId }`). If not exactly two items are found, or their `projectId`s differ, respond 404. Use the items' `projectId` for the new row. The same applies to `itemId` and `sprintId` on tasks: they must belong to the task's project. Composite foreign keys enforce this in the database for relationships and `tasks.item_id`, but not for `tasks.sprint_id`, so the service check is required.
- Users can name items freely, but the category (item type) is fixed by the template.
- A game template (Could) is added as another template definition, with no change to the rest of the code.

### Data model (starting point, refine in sprint 1)

- `projects`: id, user_id (plain UUID of the Supabase user, no Prisma relation to `auth.users`), name, template, created_at
- `items`: id, project_id, type, title, description, status (`planned` | `in_progress` | `done`), is_mvp, position_x, position_y, created_at
- `relationships`: id, project_id, source_item_id, target_item_id, type. Unique on (source, target, type). An item cannot be connected to itself.
- `tasks`: id, project_id, item_id (optional), title, done, sprint_id (optional)
- `sprints`: id, project_id, name

Use database constraints, foreign keys (with cascade delete) and enums in addition to Zod.

## Scope (MoSCoW)

**Must (the MVP)**: register, log in and log out (Supabase Auth); projects CRUD; data protected per user; generic data model with one web template (pages, components, functions, data, design, assets, authentication, testing, tech stack, MVP, project description); items CRUD with status; typed relationships with Zod rules; File view; relationship map in React Flow; progress overview (planned vs completed, per category and total); API validation and error handling; deployed version; README; secrets in environment variables.

**Should**: create items and connections from the map and save node positions; todo list; impact view; warnings for overlooked things; filter the map; search items; mark items as MVP; inspiration links and images per item; link tasks to items; sprints; automated tests for core logic; responsive layout; loading and error states and delete confirmation.

**Could**: game template; AI analysis ("what might I have missed?") and AI-created sprint plan, called only from the backend; MoSCoW tag on items; drag-and-drop sprint board; task dependencies; sprint dates and timeline; vision, target users and user journeys sections; auto-layout and grouping on the map; filter in the File view; dark mode.

**Won't**: real-time collaboration, code generation from the plan, integrations (GitHub, Linear, Figma), mobile app, templates beyond web and game, editor for user-created templates and item types, teams, roles, permissions and payments, automatic generation of a whole plan from an idea.

## Sprints (5 weeks, one sprint per week)

1. Foundation and first deploy: repo, Supabase, Prisma schema and first migration, RLS, Supabase Auth in the frontend, Express skeleton (token middleware, Zod middleware, error handler), deploy both parts, Figma wireframes, React Flow prototype.
2. Projects, template and items: project CRUD, web template in code, item CRUD, File view, ownership tests (including a test with two users).
3. Relationships and the map: relationships with Zod rules, React Flow map, connections shown in the File view, tests for relationship rules.
4. Progress and finished MVP: progress overview, polish and deploy the MVP, tests for progress, then start Should (create from map, todo list, sprints).
5. Understanding the plan, quality and finishing: impact view, warnings, remaining Should items, error and loading states, security review, README, AI-use documentation.

Current sprint: **1** (update this line when the sprint changes).

Cut line if time runs short: Could first, then search, filter, MVP marking and responsive layout. Tests and the security check are never cut. Tests are written in the same sprint as the logic.

## Project structure

```
planter/
  CLAUDE.md
  README.md
  docs/                 project-plan.md, ai-log.md
  frontend/
    src/
      lib/              supabaseClient.ts, api.ts (fetch wrapper that adds the token)
      auth/             AuthProvider, Login, Register, ProtectedRoute
      pages/            top-level pages
      features/         projects, items, relationships, map, file-view, progress
      components/       shared UI components
      types/
  backend/
    tests/
    prisma/             schema.prisma, migrations/
    src/
      app.ts            Express app (exported, used by Supertest)
      server.ts         starts the server
      config/           env.ts (validates environment variables with Zod)
      middleware/       requireAuth.ts, validate.ts, errorHandler.ts
      routes/           projects.ts, items.ts, relationships.ts, tasks.ts, sprints.ts
      services/         business logic: ownership, relationships, progress, warnings
      schemas/          Zod schemas
      templates/        web.ts, index.ts
      lib/              prisma.ts, supabase.ts
```

## Conventions

- TypeScript strict mode. No `any` without a comment explaining why.
- Routes are thin: validate, check ownership, call a service, return the result. Logic lives in `services/`.
- API errors have one shape: `{ "error": { "message": string, "details"?: unknown } }`. Use 400 for validation errors, 401 when not logged in, 404 when the resource does not exist or is not owned by the user.
- React components in PascalCase files, other modules in camelCase. Named exports.
- Code, comments, commit messages and documentation in English.
- Small commits with clear messages (for example `feat: add item CRUD routes`). Commit often.
- UI language is English unless I say otherwise.

## Commands (fill in as they are set up)

- Frontend (`frontend/`): `npm run dev` (Vite, port 5173), `npm test`, `npm run build`
- Backend (`backend/`): `npm run dev` (port 3000), `npm test`, `npm run build`
- Prisma (`backend/`): `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`

## Environment variables

Never commit `.env` files. Keep `.env.example` files with the names below and no values.

- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- Backend: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (for CORS), `PORT`, later `AI_API_KEY`

## Definition of Done

- All Must items work, including both the File view and the map, which show the same data
- Frontend and backend are deployed and tested end to end from another device
- Automated tests pass for relationship rules, progress calculation and ownership (including a test with two users)
- Security check done: RLS is enabled on every table (no rows from `select tablename from pg_tables where schemaname = 'public' and not rowsecurity;`, and a Data API request with the anon key returns nothing), ownership is checked on every route, all input goes through Zod, no secrets in the repo
- README explains how to install, configure and run the project
- AI use is documented in `docs/ai-log.md` and in the thesis
- Each feature validates its input, shows loading and error states, and has been reviewed