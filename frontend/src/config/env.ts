import { z } from "zod";

// Checks with Zod that every VITE_ variable exists and has the right shape.
// If one is missing, the app throws at startup with a clear message instead of failing later.
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