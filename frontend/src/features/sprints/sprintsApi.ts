import { apiRequest } from "../../lib/api";
import type { Sprint } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listSprints(projectId: string) {
  return apiRequest<Sprint[]>(`/api/projects/${projectId}/sprints`);
}

export function createSprint(projectId: string, name: string) {
  return apiRequest<Sprint>(`/api/projects/${projectId}/sprints`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateSprint(id: string, name: string) {
  return apiRequest<Sprint>(`/api/sprints/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteSprint(id: string) {
  return apiRequest<void>(`/api/sprints/${id}`, { method: "DELETE" });
}
