import { z } from "zod";
import { getTemplate } from "../templates/index.js";
import { createGroupSchema } from "./groups.js";
import { createItemSchema } from "./items.js";
import { createTaskSchema } from "./tasks.js";
import { textSchema } from "./text.js";

// The project's own fields. Shared by create and update.
const projectFieldsSchema = z.object({
  name: textSchema.trim().min(1).max(100),
  description: textSchema.max(500).optional(),
  template: z
    .string()
    .refine((key) => getTemplate(key) !== undefined, "Unknown template"),
});

// Max entries per starter list. Enough for "what I already know", small enough that one request stays fast.
export const MAX_STARTER_ENTRIES = 50;

// Create: the project, plus optional "things you already know" from the new-project page.
// The entries reuse the item, group and task schemas, so the length rules live in one place.
// Whether an item type exists in the template is checked by the service (it depends on `template`).
export const createProjectSchema = projectFieldsSchema.extend({
  items: z.array(createItemSchema.pick({ type: true, title: true })).max(MAX_STARTER_ENTRIES).optional(),
  groups: z.array(createGroupSchema.pick({ name: true })).max(MAX_STARTER_ENTRIES).optional(),
  tasks: z.array(createTaskSchema.pick({ title: true })).max(MAX_STARTER_ENTRIES).optional(),
});
// The TypeScript type of a validated request body, derived from the schema
export type CreateProjectInput = z.infer<typeof createProjectSchema>;


// check that projects id is uuid. Two names, because they are different parts of the URL:
// :id in /api/projects/:id, and :projectId in nested routes like /api/projects/:projectId/items
export const projectIdSchema = z.object({ id: z.uuid() });
export const projectIdParamSchema = z.object({ projectId: z.uuid() });


//only update name and description (built from the fields, not from create, so no starter lists)
export const updateProjectSchema = projectFieldsSchema
  .omit({ template: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;