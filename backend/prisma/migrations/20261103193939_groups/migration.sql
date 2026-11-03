-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_items" (
    "group_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,

    CONSTRAINT "group_items_pkey" PRIMARY KEY ("group_id","item_id")
);

-- CreateIndex
CREATE INDEX "groups_project_id_idx" ON "groups"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_id_project_id_key" ON "groups"("id", "project_id");

-- CreateIndex
CREATE INDEX "group_items_item_id_idx" ON "group_items"("item_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_items" ADD CONSTRAINT "group_items_group_id_project_id_fkey" FOREIGN KEY ("group_id", "project_id") REFERENCES "groups"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_items" ADD CONSTRAINT "group_items_item_id_project_id_fkey" FOREIGN KEY ("item_id", "project_id") REFERENCES "items"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "groups"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_items" ENABLE ROW LEVEL SECURITY;
