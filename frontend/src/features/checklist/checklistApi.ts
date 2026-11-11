import { apiRequest } from "../../lib/api";
import type { Check } from "./types";

// Every check of the project, passed or not. Throws an ApiError when the request fails.
export function getChecklist(projectId: string) {
  return apiRequest<Check[]>(`/api/projects/${projectId}/checklist`);
}
