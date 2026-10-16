import { supabase } from "./supabaseClient";
import { env } from "../config/env";

// Used instead of fetch() for all calls to backend.
// adds the logged-in user's token as an Authorization header.
export async function apiFetch(path: string, options: RequestInit = {}) {
  // getSession() returns the current session and refreshes the token if it expired
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fetch(`${env.VITE_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
