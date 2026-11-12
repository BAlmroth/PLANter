import { apiRequest } from "../../lib/api";
import type { ColorInput, ItemColorLink, ProjectColor } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

// THE PALETTE
export function listColors(projectId: string) {
  return apiRequest<ProjectColor[]>(`/api/projects/${projectId}/colors`);
}

export function createColor(projectId: string, input: ColorInput) {
  return apiRequest<ProjectColor>(`/api/projects/${projectId}/colors`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// name: "" clears the name
export function updateColor(id: string, input: Partial<ColorInput>) {
  return apiRequest<ProjectColor>(`/api/colors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Also removes the color from every item that uses it
export function deleteColor(id: string) {
  return apiRequest<void>(`/api/colors/${id}`, { method: "DELETE" });
}

// WHICH ITEMS USE WHICH COLORS
// All links in the project at once (group them per item or per color in the page)
export function listItemColors(projectId: string) {
  return apiRequest<ItemColorLink[]>(`/api/projects/${projectId}/item-colors`);
}

export function linkColor(itemId: string, colorId: string) {
  return apiRequest<ItemColorLink>(`/api/items/${itemId}/colors/${colorId}`, { method: "PUT" });
}

// The color stays in the palette
export function unlinkColor(itemId: string, colorId: string) {
  return apiRequest<void>(`/api/items/${itemId}/colors/${colorId}`, { method: "DELETE" });
}
