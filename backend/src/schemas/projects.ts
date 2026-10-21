import { z } from "zod";
import { getTemplate } from "../templates/index.js";

//zod schema for projects
export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z
    .string()
    .refine((key) => getTemplate(key) !== undefined, "Unknown template"),
});
// The TypeScript type of a validated request body, derived from the schema
export type CreateProjectInput = z.infer<typeof createProjectSchema>;


// check that projects id is uuid
export const projectIdSchema = z.object({ id: z.uuid() });


//only update name and description
export const updateProjectSchema = createProjectSchema
  .omit({ template: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;