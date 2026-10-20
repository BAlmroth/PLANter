import { z } from "zod";
import { getTemplate } from "../templates/index.js";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z
    .string()
    .refine((key) => getTemplate(key) !== undefined, "Unknown template"),
});
