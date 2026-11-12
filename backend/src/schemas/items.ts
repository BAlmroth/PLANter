import { z } from "zod";
import { textSchema } from "./text.js";

const statusSchema = z.enum(["planned", "in_progress", "done"]);
//zod schema for items
export const createItemSchema = z.object({
  title: textSchema.trim().min(1).max(100),
  // Not textSchema: the type must match a template key exactly, so anything else is already a 400
  type: z.string().min(1),
  description: textSchema.max(500).optional(),
  status: statusSchema.optional(), // db default "planned"
  isMvp: z.boolean().optional(),   // bd default false
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

// Map positions: finite numbers only (z.number() rejects NaN and Infinity), within a sane range
const positionSchema = z.number().min(-100000).max(100000);

// For PATCH: the same fields, all optional, but at least one must be sent.
// positionX and positionY are saved when a node is dragged on the map.
// confirmRelationshipRemoval is not an item field: it says "yes, delete the connections that a
// type change makes invalid" (see updateItem).
export const updateItemSchema = createItemSchema
  .partial()
  .extend({
    positionX: positionSchema.optional(),
    positionY: positionSchema.optional(),
    confirmRelationshipRemoval: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// :id in /api/items/:id
export const itemIdSchema = z.object({ id: z.uuid() });