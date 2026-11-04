import { apiRequest } from "../../lib/api";
import type { CreateTaskInput, Task, UpdateTaskInput } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listTasks(projectId: string) {
  return apiRequest<Task[]>(`/api/projects/${projectId}/tasks`);
}

export function createTask(projectId: string, input: CreateTaskInput) {
  return apiRequest<Task>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string) {
  return apiRequest<void>(`/api/tasks/${id}`, { method: "DELETE" });
}
