import { z } from "zod";

// Safety filter for environment variables: checks that every variable we need exists and has the right type, and stops the server at startup with a clear message if not instead of causing confusing bugs later. checking though zod schema that defines how the data sshould look like

//zod checks data
// Describe which environment variables we expect and what they should look like
const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_API_URL: z.url(),
});

const result = schema.safeParse(import.meta.env);

if (!result.success) {
  throw new Error(
    "Missing or invalid environment variables:\n" +
      result.error.issues.map((i) => `- ${i.path}: ${i.message}`).join("\n"),
  );
}

// The validated values.
export const env = result.data;