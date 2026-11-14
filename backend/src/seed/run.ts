import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { DEMOS, seedDemoProject } from "./seedDemo.js";

// Usage (in backend/):  npm run seed:demo -- <supabase-user-id> [web|game]
// The user id is the id of the account that should own the demo project
// (Supabase dashboard -> Authentication -> Users). The second argument picks the demo:
// "web" (Awesome Demo Portfolio, the default) or "game" (Emerald Brew).
// Both are checked here like any other input.
const USAGE = `Usage: npm run seed:demo -- <user-id> [${Object.keys(DEMOS).join("|")}]  (the id must be a UUID)`;
const userId = z.uuid().safeParse(process.argv[2]);
const demoName = process.argv[3] ?? "web";
// Object.hasOwn: "constructor" or "__proto__" must not count as a demo name
const demo = Object.hasOwn(DEMOS, demoName) ? DEMOS[demoName] : undefined;
if (!userId.success || !demo) {
  console.error(USAGE);
  process.exit(1);
}

try {
  const result = await seedDemoProject(userId.data, demo);
  console.log("Demo project created:", result);
} finally {
  await prisma.$disconnect();
}
