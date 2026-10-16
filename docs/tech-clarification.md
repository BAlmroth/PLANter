# PLANter: How the Parts Fit Together

## requireAuth (Express middleware)

requireAuth answers one question on every request: **who is sending this?** It is a small function in `backend/src/middleware/requireAuth.ts` that runs before every route except `/health`.

1. It reads the `Authorization: Bearer <token>` header.
2. It asks Supabase whether the token is valid, using the backend Supabase client in `lib/supabase.ts` (`supabase.auth.getUser(token)`).
3. If the token is missing or invalid, it responds **401** and stops. The route never runs.
4. If the token is valid, it saves the user id on the request (for example `req.userId`). Routes use that id, never an id from the request body (rule 2).

It does not check ownership. That is a separate step: the shared ownership helper.

## Supabase

Supabase holds the database and the login system, and does five jobs in PLANter. The frontend uses it only for Auth (and possibly Storage), never for data tables (rule 1).

| Part | What it does for PLANter |
| --- | --- |
| Auth | Register, log in and log out. It stores and hashes passwords, so you write no cryptography (rule 7). The frontend talks to it directly and gets back the token (JWT). |
| PostgreSQL | Stores projects, items, relationships, tasks and sprints. |
| Constraints | The database refuses bad data: NOT NULL, enums for status, foreign keys with cascade delete, UNIQUE(source, target, type), and no item connected to itself. The last line of defence if a bug gets past Zod. |
| Row Level Security | Enabled on every table with no policies (deny-all). Blocks everything that reaches the database through Supabase's own API, such as someone using your public anon key, including logged-in users. It does not affect Prisma queries. |
| Storage | Files and images later, for example inspiration images per item. |

## Prisma

Prisma is how **Express talks to the database**. It sits between your code and Supabase's Postgres and does three things:

1. **Schema (`schema.prisma`)**: describes your tables (projects, items, relationships and so on) in one readable file.
2. **Migrations**: when the schema changes, `prisma migrate dev` creates and applies the SQL changes, so the database structure is versioned in git.
3. **Typed queries**: instead of SQL strings you write `prisma.item.findMany({ where: { projectId } })`. TypeScript knows which fields exist, so mistakes show up while you code.

Prisma connects with a database role that bypasses RLS. That is why the ownership check in Express is mandatory: Prisma does not know who the user is, it only does what it is told.

## Zod

Zod checks that **data has the right shape and follows the rules**. Its schemas live in `backend/src/schemas/`, and in the plan it does four things:

1. **Request validation**: creating an item requires `title` (a non-empty string), `type` (one of the template's item types) and `status` (`planned`, `in_progress` or `done`). Wrong input gets a **400** with details, before anything touches the database.
2. **Item shapes**: the shared definition of what an item is, so the API and the code agree.
3. **Relationship rules**: Express looks up the source and target item types in the database, then Zod checks against the template whether that combination of item types and relationship type is allowed. For example, "component *belongs to* page" is allowed, but "page *triggers* design" may not be.
4. **Environment variables**: `config/env.ts` checks at startup that all variables exist, so the server fails immediately instead of breaking later.

Zod does not know what is in the database. Express and Prisma fetch the item types first, and Zod judges them.

## One request from start to finish

Example: the user connects a component to a page on the map (`POST /api/relationships`).

1. **React** has the session token from Supabase Auth and sends the request with the token.
2. **requireAuth** verifies the token with Supabase Auth and gets the user id. Otherwise: 401.
3. **Zod** checks the body: valid UUIDs, and a relationship type that exists. Otherwise: 400.
4. **Ownership check** (shared helper, using Prisma): does this user own the project and both items? Otherwise: 404.
5. **Relationship rules**: Prisma fetches the types of the two items, and Zod plus the template check that the combination is allowed. Otherwise: 400.
6. **Prisma** inserts the row into Supabase Postgres.
7. **Postgres constraints and RLS** are the last safety net, for example blocking a duplicate relationship.

## Short version

- **Supabase Auth**: who you are.
- **requireAuth**: checks the proof of who you are on every request.
- **Zod**: is the data valid and allowed?
- **Ownership check**: is this yours?
- **Prisma**: reads and writes the database.
- **Supabase Postgres, constraints and RLS**: store the data and catch what slips through.
