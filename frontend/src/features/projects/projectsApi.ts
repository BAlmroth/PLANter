import { apiRequest } from "../../lib/api";
import type { CreateProjectInput, Project, UpdateProjectInput } from "./types";

// One function per backend route. Pages call these instead of writing URLs themselves.
// Each one throws an ApiError when the request fails, so pages only need a try/catch.

export function listProjects() {
  return apiRequest<Project[]>("/api/projects");
}

export function getProject(id: string) {
  return apiRequest<Project>(`/api/projects/${id}`);
};

export function createProject(input: CreateProjectInput) {
  return apiRequest<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}


export function updateProject(id: string, input: UpdateProjectInput) {
  return apiRequest<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// DELETE answers 204 with no body, so there is nothing to return
export function deleteProject(id: string) {
  return apiRequest<void>(`/api/projects/${id}`, { method: "DELETE" });
}

