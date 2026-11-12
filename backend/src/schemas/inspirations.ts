import { z } from "zod";
import { textSchema, urlSchema } from "./text.js";

// Only http and https links: this blocks "javascript:" links
const httpUrl = urlSchema
  .max(2000)
  .refine((value) => /^https?:\/\//i.test(value), "url must start with http:// or https://");

// zod schema for project inspiration. No projectId: it comes from the URL.
export const createInspirationSchema = z.object({
  title: textSchema.trim().min(1).max(100),
  url: httpUrl.optional(),
  text: textSchema.max(2000).optional(),
  // Which card on the Moodboard page the entry belongs to
  section: z.enum(["moodboard", "inspiration"]).default("moodboard"),
});
export type CreateInspirationInput = z.infer<typeof createInspirationSchema>;

// Edit: every field is optional, but at least one is needed. "" clears the url or the text.
export const updateInspirationSchema = z
  .object({
    title: createInspirationSchema.shape.title,
    url: z.union([httpUrl, z.literal("")]),
    text: createInspirationSchema.shape.text,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "edit at least one field to update");
export type UpdateInspirationInput = z.infer<typeof updateInspirationSchema>;

// :id in /api/inspirations/:id
export const inspirationIdSchema = z.object({ id: z.uuid() });
