import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { seedDemoProject } from "./seedDemo.js";

// Usage (in backend/):  npm run seed:demo -- <supabase-user-id>
// The user id is the id of the account that should own the demo project
// (Supabase dashboard -> Authentication -> Users). It is checked here like any other input.
const userId = z.uuid().safeParse(process.argv[2]);
if (!userId.success) {
  console.error("Usage: npm run seed:demo -- <user-id>  (the id must be a UUID)");
  process.exit(1);
}

try {
  const result = await seedDemoProject(userId.data);
  console.log("Demo project created:", result);
} finally {
  await prisma.$disconnect();
}
