import { z } from "zod";

// zod schema for groups. No projectId: it comes from the URL (create) or from the group itself.
export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createGroupSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// :id in /api/groups/:id
export const groupIdSchema = z.object({ id: z.uuid() });

// :id and :itemId in /api/groups/:id/items/:itemId
export const groupItemParamsSchema = z.object({ id: z.uuid(), itemId: z.uuid() });
