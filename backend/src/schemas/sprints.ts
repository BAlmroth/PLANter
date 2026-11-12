import { z } from "zod";
import { textSchema } from "./text.js";

// zod schema for sprints. No projectId: it comes from the URL (create) or from the sprint itself.
export const createSprintSchema = z.object({
  name: textSchema.trim().min(1).max(100),
});
export type CreateSprintInput = z.infer<typeof createSprintSchema>;

export const updateSprintSchema = createSprintSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

// :id in /api/sprints/:id
export const sprintIdSchema = z.object({ id: z.uuid() });
