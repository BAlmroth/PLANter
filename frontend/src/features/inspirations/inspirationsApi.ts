import { apiRequest } from "../../lib/api";
import type { Inspiration, InspirationInput } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listInspirations(projectId: string) {
  return apiRequest<Inspiration[]>(`/api/projects/${projectId}/inspirations`);
}

export function createInspiration(projectId: string, input: InspirationInput) {
  return apiRequest<Inspiration>(`/api/projects/${projectId}/inspirations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// url: "" or text: "" clears the field
export function updateInspiration(id: string, input: Partial<InspirationInput>) {
  return apiRequest<Inspiration>(`/api/inspirations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Sends the file itself as the request body (no FormData). Content-Type tells the backend what it is.
// Replaces the old image if there is one. Allowed: JPEG, PNG and WebP up to 5 MB.
export function uploadInspirationImage(id: string, file: File) {
  return apiRequest<Inspiration>(`/api/inspirations/${id}/image`, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
}

export function deleteInspiration(id: string) {
  return apiRequest<void>(`/api/inspirations/${id}`, { method: "DELETE" });
}
