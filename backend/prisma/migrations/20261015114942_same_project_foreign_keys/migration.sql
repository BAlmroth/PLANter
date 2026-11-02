/*
  Warnings:

  - A unique constraint covering the columns `[id,project_id]` on the table `items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "relationships" DROP CONSTRAINT "relationships_source_item_id_fkey";

-- DropForeignKey
ALTER TABLE "relationships" DROP CONSTRAINT "relationships_target_item_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_item_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "items_id_project_id_key" ON "items"("id", "project_id");

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_item_id_project_id_fkey" FOREIGN KEY ("source_item_id", "project_id") REFERENCES "items"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_item_id_project_id_fkey" FOREIGN KEY ("target_item_id", "project_id") REFERENCES "items"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_item_id_project_id_fkey" FOREIGN KEY ("item_id", "project_id") REFERENCES "items"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;
