import { z } from "zod";
import { createInspirationSchema, updateInspirationSchema } from "./inspirations.js";

// A detail row has the same fields and limits as a project inspiration entry
// (title max 100, http(s) url max 2000, text max 2000), so the schemas are shared.
export const createItemDetailSchema = createInspirationSchema;
export type CreateItemDetailInput = z.infer<typeof createItemDetailSchema>;
export const updateItemDetailSchema = updateInspirationSchema;
export type UpdateItemDetailInput = z.infer<typeof updateItemDetailSchema>;

// :itemId in /api/items/:itemId/details and :id in /api/item-details/:id
export const itemIdParamSchema = z.object({ itemId: z.uuid() });
export const itemDetailIdSchema = z.object({ id: z.uuid() });
