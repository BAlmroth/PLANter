import { z } from "zod";

const statusSchema = z.enum(["planned", "in_progress", "done"]);
//zod schema for items
export const createItemSchema = z.object({
  title: z.string().trim().min(1).max(100),
  type: z.string().min(1),
  description: z.string().max(500).optional(),
  status: statusSchema.optional(), // db default "planned"
  isMvp: z.boolean().optional(),   // bd default false
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

// For PATCH: the same fields, all optional, but at least one must be sent.
export const updateItemSchema = createItemSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// URL params. Two names, because they are different parts of the URL:
// :id is an item (/api/items/:id), :projectId is its project (/api/projects/:projectId/items)
export const itemIdSchema = z.object({ id: z.uuid() });
export const projectIdParamSchema = z.object({ projectId: z.uuid() });