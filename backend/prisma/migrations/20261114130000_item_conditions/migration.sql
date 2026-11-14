-- Requirements that are not items, ex "Only in summer, player level 5", shown in the item page's
-- Requirements card. Optional free text: existing items get NULL. The length limit is in Zod.
ALTER TABLE "items" ADD COLUMN "conditions" TEXT;
