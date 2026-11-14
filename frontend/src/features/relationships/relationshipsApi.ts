import { apiRequest } from "../../lib/api";
import type { CreateRelationshipInput, Relationship, UpdateRelationshipInput } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listRelationships(projectId: string) {
  return apiRequest<Relationship[]>(`/api/projects/${projectId}/relationships`);
}

export function createRelationship(input: CreateRelationshipInput) {
  return apiRequest<Relationship>("/api/relationships", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Only the amount can change
export function updateRelationship(id: string, input: UpdateRelationshipInput) {
  return apiRequest<Relationship>(`/api/relationships/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRelationship(id: string) {
  return apiRequest<void>(`/api/relationships/${id}`, { method: "DELETE" });
}
