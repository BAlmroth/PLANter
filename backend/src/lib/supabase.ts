import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// The backend Supabase client. Uses the service role key, which bypasses Row Level Security,
// so it must never leave the backend. Right now it is only used to verify login tokens.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  // A server has no browser session to remember, every request brings its own token
  auth: { persistSession: false, autoRefreshToken: false },
});
