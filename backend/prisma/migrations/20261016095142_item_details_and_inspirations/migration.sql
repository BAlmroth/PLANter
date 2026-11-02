-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "item_details" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_inspirations" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_inspirations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_details_item_id_idx" ON "item_details"("item_id");

-- CreateIndex
CREATE INDEX "project_inspirations_project_id_idx" ON "project_inspirations"("project_id");

-- AddForeignKey
ALTER TABLE "item_details" ADD CONSTRAINT "item_details_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_inspirations" ADD CONSTRAINT "project_inspirations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "item_details"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_inspirations" ENABLE ROW LEVEL SECURITY;