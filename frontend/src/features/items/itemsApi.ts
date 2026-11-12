import { apiRequest } from "../../lib/api";
import type { CreateItemInput, Item, UpdateItemInput, Template } from "./types";


// One function per backend route. Each one throws an ApiError when the request fails.

//get the labels for intended template
export function getTemplate(key: string) {
    return apiRequest<Template>(`/api/templates/${key}`)
}

export function listItems(projectId:string) {
    return apiRequest<Item[]>(`/api/projects/${projectId}/items`);
}

// export function getItem()

export function createItem(projectId: string, input: CreateItemInput) {
    return apiRequest<Item>(`/api/projects/${projectId}/items`, {
        method: "POST",
        body: JSON.stringify( input),
    });
}
export function updateItem(id: string, input: UpdateItemInput) {
    return apiRequest<Item>(`/api/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export function deleteItem(id: string) {
    return apiRequest<void>(`/api/items/${id}`, {
        method: "DELETE"
    });
}

// Sends the file itself as the request body (no FormData). Content-Type tells the backend what it is.
// Replaces the old photo if there is one. Allowed: JPEG, PNG and WebP up to 5 MB.
export function uploadItemImage(id: string, file: File) {
    return apiRequest<Item>(`/api/items/${id}/image`, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
}
