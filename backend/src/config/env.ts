import "dotenv/config";
import { z } from "zod";

// Safety filter for environment variables: checks that every variable we need exists and has the right type, and stops the server at startup with a clear message if not instead of causing confusing bugs later. checking though zod schema that defines how the data sshould look like

//zod checks data
// Describe which environment variables we expect and what they should look like
const schema = z.object({
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Check process.env against the schema (safeParse doesn't throw, it returns a result)
const result = schema.safeParse(process.env);

// If something is missing or invalid, print what's wrong and stop the server
if (!result.success) {
  console.error("Missing or invalid environment variables:");
  console.error(
    result.error.issues.map((i) => `- ${i.path}: ${i.message}`).join("\n"),
  );
  process.exit(1); // 1 = exited with an error
}

// The validated values. The rest of the app imports this instead of using process.env
export const env = result.data;
