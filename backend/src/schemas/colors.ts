import { z } from "zod";
import { textSchema } from "./text.js";

// Only "#RRGGBB" is allowed, and it is stored in upper case. Because nothing else gets through,
// a color is safe to use in a style attribute in the frontend. Also used for group colors.
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, "color must look like #3E6554")
  .transform((value) => value.toUpperCase());

// zod schema for a palette color. No projectId: it comes from the URL.
export const createColorSchema = z.object({
  hex: hexColorSchema,
  name: textSchema.trim().max(100).optional(),
});
export type CreateColorInput = z.infer<typeof createColorSchema>;

// Edit: every field is optional, but at least one is needed. "" clears the name.
export const updateColorSchema = createColorSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateColorInput = z.infer<typeof updateColorSchema>;

// :id in /api/colors/:id
export const colorIdSchema = z.object({ id: z.uuid() });
