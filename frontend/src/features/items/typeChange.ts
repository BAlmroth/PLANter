import { ApiError } from "../../lib/api";

// PATCH /api/items/:id answers 409 with { invalidRelationships: n } when a type change would
// delete connections that are no longer allowed. Returns n for that answer, and null for any
// other error, so the caller knows whether to ask the user for confirmation.
export function getInvalidRelationshipCount(err: unknown): number | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  const details = err.details;
  if (typeof details !== "object" || details === null || !("invalidRelationships" in details)) return null;
  return typeof details.invalidRelationships === "number" ? details.invalidRelationships : null;
}
