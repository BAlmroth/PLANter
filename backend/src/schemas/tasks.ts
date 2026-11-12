import { z } from "zod";
import { textSchema } from "./text.js";

// zod schema for tasks. No projectId: it comes from the URL (create) or from the task itself.
export const createTaskSchema = z.object({
  title: textSchema.trim().min(1).max(100),
  itemId: z.uuid().optional(), // the item the task is about, if any
  sprintId: z.uuid().optional(), // the sprint the task is in, if any
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// For PATCH: the same fields and done, all optional, but at least one must be sent.
// itemId and sprintId: null removes the link.
export const updateTaskSchema = createTaskSchema
  .extend({ done: z.boolean(), itemId: z.uuid().nullable(), sprintId: z.uuid().nullable() })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// :id in /api/tasks/:id
export const taskIdSchema = z.object({ id: z.uuid() });
