import { z } from "zod";
import type { Template } from "../templates/index.js";

//the shape of the request body. No projectId: the service takes it from the items.
export const createRelationshipSchema = z
  .object({
    sourceItemId: z.uuid(),
    targetItemId: z.uuid(),
    type: z.string().min(1),
  })
  .refine((body) => body.sourceItemId !== body.targetItemId, {
    message: "An item cannot be connected to itself",
  });
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

export const relationshipIdSchema = z.object({ id: z.uuid() });

// the template rules. Zod cannot look in the database, so the service loads the two
// items first and passes their types in here, together with the relationship type from the body.
export function relationshipRuleSchema(template: Template) {
  return z
    .object({
      sourceType: z.string(),
      type: z.string(),
      targetType: z.string(),
    })
    .refine(
      (rule) =>
        template.allowedCombinations.some(
          (c) =>
            c.source === rule.sourceType &&
            c.relationship === rule.type &&
            c.target === rule.targetType,
        ),
      { message: "This relationship is not allowed between these item types" },
    );
}
