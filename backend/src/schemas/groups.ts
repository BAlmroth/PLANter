import { z } from "zod";
import { hexColorSchema } from "./colors.js";

// zod schema for groups. No projectId: it comes from the URL (create) or from the group itself.
// color: Zod checks the shape (#RRGGBB, upper case). Whether it is one of the template's
// groupColors is checked in the groups service, which knows the project's template.
// Left out on create: the service picks the next unused color.
export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  color: hexColorSchema.optional(),
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
