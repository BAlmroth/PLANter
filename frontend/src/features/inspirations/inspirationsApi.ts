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

export function deleteInspiration(id: string) {
  return apiRequest<void>(`/api/inspirations/${id}`, { method: "DELETE" });
}
