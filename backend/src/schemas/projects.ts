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
