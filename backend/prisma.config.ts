import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Info for the Prisma CLI: where the schema and migrations are, and which database to use
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});