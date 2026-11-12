import { apiRequest } from "../../lib/api";
import type { ItemDetailInput, ItemDetailRow } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

export function listItemDetails(itemId: string) {
  return apiRequest<ItemDetailRow[]>(`/api/items/${itemId}/details`);
}

export function createItemDetail(itemId: string, input: ItemDetailInput) {
  return apiRequest<ItemDetailRow>(`/api/items/${itemId}/details`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// url: "" or text: "" clears the field
export function updateItemDetail(id: string, input: Partial<ItemDetailInput>) {
  return apiRequest<ItemDetailRow>(`/api/item-details/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Sends the file itself as the request body. Allowed: JPEG, PNG and WebP up to 5 MB.
export function uploadItemDetailImage(id: string, file: File) {
  return apiRequest<ItemDetailRow>(`/api/item-details/${id}/image`, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
}

export function deleteItemDetail(id: string) {
  return apiRequest<void>(`/api/item-details/${id}`, { method: "DELETE" });
}
