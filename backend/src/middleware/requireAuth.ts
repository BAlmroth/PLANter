import type { RequestHandler } from "express";
import { supabase } from "../lib/supabase.js";
import { HttpError } from "./errorHandler.js";

// Tell TypeScript that requireAuth adds userId to the request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Answers "who is sending this?" Runs before every route except /health.
// It does not check ownership, that is a separate step.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  // The header looks like: Authorization: Bearer <token>
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  // Ask Supabase if the token is valid and who it belongs to
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Invalid or expired token");
  }

  // The user id always comes from the verified token, never from the request body
  req.userId = data.user.id;
  next();
};
