import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { createColorSchema, updateColorSchema } from "../src/schemas/colors.js";
import { createGroupSchema, updateGroupSchema } from "../src/schemas/groups.js";
import { createInspirationSchema, updateInspirationSchema } from "../src/schemas/inspirations.js";
import { createItemSchema, updateItemSchema } from "../src/schemas/items.js";
import { createProjectSchema, updateProjectSchema } from "../src/schemas/projects.js";
import { createSprintSchema } from "../src/schemas/sprints.js";
import { createTaskSchema, updateTaskSchema } from "../src/schemas/tasks.js";
import { textSchema, urlSchema } from "../src/schemas/text.js";

// Postgres cannot store \u0000, so every saved text field must reject it (400, not a database error)
const NULL = "\u0000";

describe("textSchema and urlSchema", () => {
  it("reject a null character anywhere", () => {
    expect(textSchema.safeParse(`a${NULL}b`).success).toBe(false);
    expect(textSchema.safeParse(NULL).success).toBe(false);
    expect(urlSchema.safeParse(`https://example.com/${NULL}`).success).toBe(false);
  });

  it("accept normal text, including other control characters and emoji", () => {
    expect(textSchema.safeParse("Line one\nline two\ttab 🌱").success).toBe(true);
    expect(textSchema.safeParse("").success).toBe(true);
    expect(urlSchema.safeParse("https://example.com/a?b=c").success).toBe(true);
  });

  it("can still be chained with trim, min and max", () => {
    const title = textSchema.trim().min(1).max(5);
    expect(title.parse("  ok  ")).toBe("ok");
    expect(title.safeParse("   ").success).toBe(false);
    expect(title.safeParse("toolong").success).toBe(false);
  });
});

// [schema, a valid body, the text field to put a null character in]
const cases: [string, z.ZodType, Record<string, unknown>, string][] = [
  ["project name", createProjectSchema, { name: "P", template: "web" }, "name"],
  ["project description", createProjectSchema, { name: "P", template: "web", description: "d" }, "description"],
  ["project update", updateProjectSchema, { name: "P" }, "name"],
  ["item title", createItemSchema, { title: "T", type: "page" }, "title"],
  ["item description", createItemSchema, { title: "T", type: "page", description: "d" }, "description"],
  ["item update", updateItemSchema, { title: "T" }, "title"],
  ["task title", createTaskSchema, { title: "T" }, "title"],
  ["task update", updateTaskSchema, { title: "T" }, "title"],
  ["sprint name", createSprintSchema, { name: "S" }, "name"],
  ["group name", createGroupSchema, { name: "G" }, "name"],
  ["group description", createGroupSchema, { name: "G", description: "d" }, "description"],
  ["group update", updateGroupSchema, { name: "G" }, "name"],
  ["color name", createColorSchema, { hex: "#3E6554", name: "n" }, "name"],
  ["color update", updateColorSchema, { name: "n" }, "name"],
  ["inspiration title", createInspirationSchema, { title: "T" }, "title"],
  ["inspiration text", createInspirationSchema, { title: "T", text: "t" }, "text"],
  ["inspiration url", createInspirationSchema, { title: "T", url: "https://example.com/" }, "url"],
  ["inspiration update", updateInspirationSchema, { text: "t" }, "text"],
];

describe("every saved text field rejects a null character", () => {
  for (const [name, schema, valid, field] of cases) {
    it(name, () => {
      // The valid body passes, so a failure below is caused by the null character only
      expect(schema.safeParse(valid).success).toBe(true);
      const withNull = { ...valid, [field]: `${String(valid[field])}${NULL}` };
      expect(schema.safeParse(withNull).success).toBe(false);
    });
  }

  it("also inside the starter lists of a new project", () => {
    const base = { name: "P", template: "web" };
    expect(createProjectSchema.safeParse({ ...base, items: [{ type: "page", title: `a${NULL}` }] }).success).toBe(false);
    expect(createProjectSchema.safeParse({ ...base, groups: [{ name: `a${NULL}` }] }).success).toBe(false);
    expect(createProjectSchema.safeParse({ ...base, tasks: [{ title: `a${NULL}` }] }).success).toBe(false);
  });
});
