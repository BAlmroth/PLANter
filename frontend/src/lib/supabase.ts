import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// One shared Supabase client for the whole frontend
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
);
