-- Every group gets a color ("#RRGGBB", one of the template's groupColors).
-- Prisma generated "ADD COLUMN color TEXT NOT NULL", which fails when groups already exist,
-- so it is done in three steps instead.

-- 1. Add the column without NOT NULL, so existing rows are allowed to be empty for a moment
ALTER TABLE "groups" ADD COLUMN "color" TEXT;

-- 2. Give existing groups a color: within each project, the oldest group gets the 1st color,
--    the next the 2nd, and so on, starting over after the 8th. The list is a copy of the web
--    template's groupColors at the time of this migration (sky, mint, lavender, gold, rose,
--    sea, sand, lime). row_number() numbers the groups 1, 2, 3... per project (PARTITION BY).
UPDATE "groups" AS g
SET "color" = (ARRAY['#3D8FD1', '#2E9A6E', '#8C6FD1', '#B08A1E', '#D45A8A', '#2B9A9A', '#A5835A', '#6F9A2A'])
  [((numbered.n - 1) % 8) + 1]
FROM (
  SELECT "id", row_number() OVER (PARTITION BY "project_id" ORDER BY "created_at", "id") AS n
  FROM "groups"
) AS numbered
WHERE g."id" = numbered."id";

-- 3. Now every row has a color, so the column can be required
ALTER TABLE "groups" ALTER COLUMN "color" SET NOT NULL;
