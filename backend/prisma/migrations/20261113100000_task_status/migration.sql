-- A task gets the same three statuses as an item (the board columns), instead of only done or not.
ALTER TABLE "tasks" ADD COLUMN "status" "Status" NOT NULL DEFAULT 'planned';

-- Keep what the user already ticked
UPDATE "tasks" SET "status" = 'done' WHERE "done" = true;

ALTER TABLE "tasks" DROP COLUMN "done";
