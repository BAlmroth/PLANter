import { apiRequest } from "../../lib/api";
import type { CreateItemInput, Item, UpdateItemInput } from "./types";

// One function per backend route. Each one throws an ApiError when the request fails.

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
export function UpdateItem(id: string, input: UpdateItemInput) {
    return apiRequest<Item>(`/api/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export function DeleteItem(id: string) {
    return apiRequest<void>(`/api/items/${id}`, {
        method: "DELETE"
    });
}