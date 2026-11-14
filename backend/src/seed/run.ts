import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { DEMOS, seedDemoProject } from "./seedDemo.js";

// Usage (in backend/):  npm run seed:demo -- <supabase-user-id> [web|game]
// The user id is the id of the account that should own the demo projects
// (Supabase dashboard -> Authentication -> Users). Without a second argument, every demo is created
// (Awesome Demo Portfolio and Emerald Brew). "web" or "game" creates only that one.
// Both arguments are checked here like any other input.
const USAGE = `Usage: npm run seed:demo -- <user-id> [${Object.keys(DEMOS).join("|")}]  (the id must be a UUID)`;
const userId = z.uuid().safeParse(process.argv[2]);
const demoName = process.argv[3];
// Object.hasOwn: "constructor" or "__proto__" must not count as a demo name
const known = demoName === undefined || Object.hasOwn(DEMOS, demoName);
if (!userId.success || !known) {
  console.error(USAGE);
  process.exit(1);
}
const names = demoName === undefined ? Object.keys(DEMOS) : [demoName];

try {
  // One after the other, each in its own transaction (see seedDemoProject). If one fails,
  // the ones before it are already saved, and running the command again is safe.
  for (const name of names) {
    // "!": every name is a key of DEMOS (checked above, or taken from Object.keys)
    const result = await seedDemoProject(userId.data, DEMOS[name]!);
    console.log(`Demo project created (${name}):`, result);
  }
} finally {
  await prisma.$disconnect();
}
