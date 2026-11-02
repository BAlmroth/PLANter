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

// An error from the API. Pages can read `status` (for example 404 = "not found")
// and show `message` to the user. `details` holds the Zod issues on a 400.
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// The backend always sends errors as { error: { message, details? } }.
// This checks that a response body really has that shape before we read it.
function readErrorBody(body: unknown): { message: string; details?: unknown } | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const error = body.error;
  if (typeof error !== "object" || error === null || !("message" in error)) return null;
  if (typeof error.message !== "string") return null;
  return { message: error.message, details: "details" in error ? error.details : undefined };
}

// Like apiFetch, but returns the parsed JSON and throws ApiError when the request fails.
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, options);
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  //after delete
  if (res.status === 204) return undefined as T;

  // The body might not be JSON (for example an error page from a proxy), so don't let that crash
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = readErrorBody(body);
    throw new ApiError(
      res.status,
      parsed?.message ?? `Request failed (${res.status})`,
      parsed?.details,
    );
  }

  return body as T;
}
