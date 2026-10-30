import { describe, it, expect } from "vitest";
import { createRelationshipSchema, relationshipRuleSchema } from "../src/schemas/relationships.js";
import { webTemplate } from "../src/templates/web.js";

const ID_A = "00000000-0000-4000-8000-000000000001";
const ID_B = "00000000-0000-4000-8000-000000000002";

describe("createRelationshipSchema", () => {
  it("accepts two different items and a type", () => {
    const result = createRelationshipSchema.safeParse({
      sourceItemId: ID_A,
      targetItemId: ID_B,
      type: "uses",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an item connected to itself", () => {
    const result = createRelationshipSchema.safeParse({
      sourceItemId: ID_A,
      targetItemId: ID_A,
      type: "uses",
    });
    expect(result.success).toBe(false);
  });

  it("rejects ids that are not UUIDs", () => {
    const result = createRelationshipSchema.safeParse({
      sourceItemId: "abc",
      targetItemId: ID_B,
      type: "uses",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing type", () => {
    const result = createRelationshipSchema.safeParse({ sourceItemId: ID_A, targetItemId: ID_B });
    expect(result.success).toBe(false);
  });
});

describe("relationshipRuleSchema (web template)", () => {
  const schema = relationshipRuleSchema(webTemplate);

  it("allows a combination that is in the template", () => {
    const result = schema.safeParse({ sourceType: "component", type: "belongs_to", targetType: "page" });
    expect(result.success).toBe(true);
  });

  it("rejects a combination that is not in the template", () => {
    const result = schema.safeParse({ sourceType: "page", type: "triggers", targetType: "design" });
    expect(result.success).toBe(false);
  });

  it("does not allow the relationship the other way around", () => {
    // "component belongs to page" is allowed, "page belongs to component" is not
    const result = schema.safeParse({ sourceType: "page", type: "belongs_to", targetType: "component" });
    expect(result.success).toBe(false);
  });

  it("lets a page navigate to a page, but not trigger one", () => {
    expect(schema.safeParse({ sourceType: "page", type: "navigates_to", targetType: "page" }).success).toBe(true);
    expect(schema.safeParse({ sourceType: "page", type: "triggers", targetType: "page" }).success).toBe(false);
  });

  it("lets a component navigate to a page, but not trigger one", () => {
    expect(schema.safeParse({ sourceType: "component", type: "navigates_to", targetType: "page" }).success).toBe(true);
    expect(schema.safeParse({ sourceType: "component", type: "triggers", targetType: "page" }).success).toBe(false);
  });

  it("rejects an unknown relationship type", () => {
    const result = schema.safeParse({ sourceType: "component", type: "hugs", targetType: "page" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown item type", () => {
    const result = schema.safeParse({ sourceType: "spaceship", type: "uses", targetType: "design" });
    expect(result.success).toBe(false);
  });

  it("allows every combination listed in the template", () => {
    for (const c of webTemplate.allowedCombinations) {
      const result = schema.safeParse({ sourceType: c.source, type: c.relationship, targetType: c.target });
      expect(result.success).toBe(true);
    }
  });
});
