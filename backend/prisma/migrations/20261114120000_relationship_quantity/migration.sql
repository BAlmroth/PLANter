-- How many of the target a connection needs, ex "House 2 made from 20 Wood" or "Sword costs 50 Gold".
-- Optional: existing connections get NULL (no amount). Zod and the service only allow it on
-- relationship types with hasQuantity in the template. The CHECK is the last safety net.
ALTER TABLE "relationships" ADD COLUMN "quantity" INTEGER;

ALTER TABLE "relationships"
  ADD CONSTRAINT "relationships_quantity_positive" CHECK ("quantity" > 0);
