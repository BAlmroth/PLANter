import { apiRequest } from "../../lib/api";
import type { Warning } from "./types";

// Throws an ApiError when the request fails
export function getWarnings(projectId: string) {
  return apiRequest<Warning[]>(`/api/projects/${projectId}/warnings`);
}
