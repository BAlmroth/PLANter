-- Moodboard and inspiration are two separate parts of the Moodboard page, each with text, images and links.
CREATE TYPE "InspirationSection" AS ENUM ('moodboard', 'inspiration');

ALTER TABLE "project_inspirations" ADD COLUMN "section" "InspirationSection" NOT NULL DEFAULT 'moodboard';

-- Until now a row with a link was inspiration and all the others were the moodboard
UPDATE "project_inspirations" SET "section" = 'inspiration' WHERE "url" IS NOT NULL;
