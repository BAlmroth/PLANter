-- CreateTable
CREATE TABLE "item_colors" (
    "item_id" UUID NOT NULL,
    "color_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,

    CONSTRAINT "item_colors_pkey" PRIMARY KEY ("item_id","color_id")
);

-- CreateIndex
CREATE INDEX "item_colors_color_id_idx" ON "item_colors"("color_id");

-- CreateIndex
CREATE INDEX "item_colors_project_id_idx" ON "item_colors"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_colors_id_project_id_key" ON "project_colors"("id", "project_id");

-- AddForeignKey
ALTER TABLE "item_colors" ADD CONSTRAINT "item_colors_item_id_project_id_fkey" FOREIGN KEY ("item_id", "project_id") REFERENCES "items"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_colors" ADD CONSTRAINT "item_colors_color_id_project_id_fkey" FOREIGN KEY ("color_id", "project_id") REFERENCES "project_colors"("id", "project_id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS
ALTER TABLE "item_colors" ENABLE ROW LEVEL SECURITY;
