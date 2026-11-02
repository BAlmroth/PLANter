import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

// An adapter is how Prisma talks to Postgres, connects with the pooled DATABASE_URL
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// One shared client for the whole app
export const prisma = new PrismaClient({ adapter });