import { z } from "zod";
import type { Template } from "../templates/index.js";

// An amount on a connection ("made from 20 Wood"). A whole number, so "1.5 wood" or "-3" is a 400.
// The max keeps it a plausible plan value. Whether the type allows an amount is checked by the service.
export const quantitySchema = z.number().int().min(1).max(9999);

//the shape of the request body. No projectId: the service takes it from the items.
export const createRelationshipSchema = z
  .object({
    sourceItemId: z.uuid(),
    targetItemId: z.uuid(),
    type: z.string().min(1),
    quantity: quantitySchema.optional(),
  })
  .refine((body) => body.sourceItemId !== body.targetItemId, {
    message: "An item cannot be connected to itself",
  });
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

export const relationshipIdSchema = z.object({ id: z.uuid() });

// PATCH: only the amount can change. The items and the type cannot: that is a different connection
// (delete it and make a new one), and changing them would skip the template and loop checks.
// Required, so an empty body is a 400 instead of a request that does nothing. null removes the amount.
export const updateRelationshipSchema = z.object({
  quantity: quantitySchema.nullable(),
});
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;

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
