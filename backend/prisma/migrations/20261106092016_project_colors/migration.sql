-- CreateTable
CREATE TABLE "project_colors" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "hex" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_colors_project_id_idx" ON "project_colors"("project_id");

-- AddForeignKey
ALTER TABLE "project_colors" ADD CONSTRAINT "project_colors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "project_colors" ENABLE ROW LEVEL SECURITY;
