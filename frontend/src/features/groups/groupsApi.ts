import { apiRequest } from "../../lib/api";
import type { Group, GroupInput } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listGroups(projectId: string) {
  return apiRequest<Group[]>(`/api/projects/${projectId}/groups`);
}

export function createGroup(projectId: string, input: GroupInput) {
  return apiRequest<Group>(`/api/projects/${projectId}/groups`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateGroup(id: string, input: GroupInput) {
  return apiRequest<Group>(`/api/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteGroup(id: string) {
  return apiRequest<void>(`/api/groups/${id}`, { method: "DELETE" });
}

export function addItemToGroup(groupId: string, itemId: string) {
  return apiRequest<void>(`/api/groups/${groupId}/items/${itemId}`, { method: "PUT" });
}

export function removeItemFromGroup(groupId: string, itemId: string) {
  return apiRequest<void>(`/api/groups/${groupId}/items/${itemId}`, { method: "DELETE" });
}
