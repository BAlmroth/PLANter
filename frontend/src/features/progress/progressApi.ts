import { apiRequest } from "../../lib/api";
import type { Progress } from "./types";

// Throws an ApiError when the request fails
export function getProgress(projectId: string) {
  return apiRequest<Progress>(`/api/projects/${projectId}/progress`);
}
