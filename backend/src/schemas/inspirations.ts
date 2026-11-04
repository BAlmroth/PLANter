import { z } from "zod";

// Only http and https links: this blocks "javascript:" links
const httpUrl = z
  .url()
  .max(2000)
  .refine((value) => /^https?:\/\//i.test(value), "url must start with http:// or https://");

// zod schema for project inspiration. No projectId: it comes from the URL.
export const createInspirationSchema = z.object({
  title: z.string().trim().min(1).max(100),
  url: httpUrl.optional(),
  text: z.string().max(2000).optional(),
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
