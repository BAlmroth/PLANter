import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { gameDemo } from "../src/seed/demoGame.js";
import { seedDemoProject } from "../src/seed/seedDemo.js";
import { relationshipRuleSchema, quantitySchema } from "../src/schemas/relationships.js";
import { wouldCreateCycle } from "../src/services/relationships.js";
import { findWarnings } from "../src/services/warnings.js";
import { getTemplate } from "../src/templates/index.js";

// Own user (...51), because test files share one database
const USER = "00000000-0000-4000-8000-000000000051";
const template = getTemplate("game")!;
const { project, items, relationships, groups, sprints, backlogTasks } = gameDemo;
const byRef = new Map(items.map((i) => [i.ref, i]));
const allTasks = [...sprints.flatMap((s) => s.tasks), ...backlogTasks];

describe("game demo seed data (Emerald Brew)", () => {
  it("uses the game template, unique refs and only known item types", () => {
    expect(project.template).toBe("game");
    expect(byRef.size).toBe(items.length);
    const keys = template.itemTypes.map((t) => t.key);
    for (const item of items) expect(keys, item.ref).toContain(item.type);
  });

  it("uses every category, every connection type and every status", () => {
    expect(new Set(items.map((i) => i.type))).toEqual(new Set(template.itemTypes.map((t) => t.key)));
    expect(new Set(relationships.map((r) => r.type))).toEqual(new Set(template.relationshipTypes.map((t) => t.key)));
    expect(new Set(items.map((i) => i.status))).toEqual(new Set(["planned", "in_progress", "done"]));
  });

  it("only has connections the template allows, between existing items, without duplicates", () => {
    const rule = relationshipRuleSchema(template);
    for (const r of relationships) {
      const source = byRef.get(r.source);
      const target = byRef.get(r.target);
      expect(source, r.source).toBeDefined();
      expect(target, r.target).toBeDefined();
      expect(r.source).not.toBe(r.target);
      expect(rule.safeParse({ sourceType: source!.type, type: r.type, targetType: target!.type }).success, `${r.source} ${r.type} ${r.target}`).toBe(true);
    }
    const seen = new Set(relationships.map((r) => `${r.source}|${r.target}|${r.type}`));
    expect(seen.size).toBe(relationships.length);
  });

  it("has amounts only where the template allows them, and only valid ones", () => {
    for (const r of relationships.filter((x) => x.quantity !== undefined)) {
      const type = template.relationshipTypes.find((t) => t.key === r.type);
      expect(type?.hasQuantity, `${r.source} ${r.type} ${r.target}`).toBe(true);
      expect(quantitySchema.safeParse(r.quantity).success, `${r.quantity}`).toBe(true);
    }
    // At least one recipe and one price, so the Requirements card has something to show
    expect(relationships.some((r) => r.type === "made_from" && r.quantity)).toBe(true);
    expect(relationships.some((r) => r.type === "costs" && r.quantity)).toBe(true);
    expect(items.some((i) => i.conditions)).toBe(true);
  });

  it("has no loops for connection types that forbid them", () => {
    for (const type of template.relationshipTypes.filter((t) => !t.allowCycles).map((t) => t.key)) {
      const edges: { sourceItemId: string; targetItemId: string }[] = [];
      for (const r of relationships.filter((x) => x.type === type)) {
        expect(wouldCreateCycle(edges, r.source, r.target), `${r.source} -> ${r.target}`).toBe(false);
        edges.push({ sourceItemId: r.source, targetItemId: r.target });
      }
    }
  });

  it("gives every item its own spot, and points groups and tasks at existing items", () => {
    expect(new Set(items.map((i) => `${i.col},${i.row}`)).size).toBe(items.length);
    for (const g of groups) for (const ref of g.items) expect(byRef.has(ref), ref).toBe(true);
    for (const t of allTasks) if (t.item) expect(byRef.has(t.item), t.item).toBe(true);
  });

  it("respects the Zod length limits", () => {
    expect(project.description.length).toBeLessThanOrEqual(500);
    for (const i of items) {
      expect(i.title.length, i.ref).toBeLessThanOrEqual(100);
      expect((i.description ?? "").length, i.ref).toBeLessThanOrEqual(500);
      expect((i.conditions ?? "").length, i.ref).toBeLessThanOrEqual(500);
    }
  });

  it("has no warnings: every character appears somewhere and every unfinished MVP item has a task", () => {
    const warningItems = items.map((i) => ({ id: i.ref, type: i.type, title: i.title, status: i.status, isMvp: i.isMvp ?? false }));
    const warningRels = relationships.map((r) => ({ sourceItemId: r.source, targetItemId: r.target, type: r.type }));
    const warningTasks = allTasks.map((t) => ({ itemId: t.item ?? null }));
    expect(findWarnings(template, warningItems, warningRels, warningTasks)).toEqual([]);
  });
});

describe("seedDemoProject with the game demo (database)", () => {
  beforeEach(() => prisma.project.deleteMany({ where: { userId: USER } }));
  afterAll(async () => {
    await prisma.project.deleteMany({ where: { userId: USER } });
    await prisma.$disconnect();
  });

  it("creates the whole project, with amounts and conditions", async () => {
    const result = await seedDemoProject(USER, gameDemo);
    const created = await prisma.project.findUniqueOrThrow({
      where: { id: result.projectId },
      include: { _count: { select: { items: true, relationships: true, groups: true, sprints: true, tasks: true } } },
    });
    expect(created).toMatchObject({ userId: USER, name: "Emerald Brew", template: "game" });
    expect(created._count).toEqual({
      items: items.length,
      relationships: relationships.length,
      groups: groups.length,
      sprints: sprints.length,
      tasks: allTasks.length,
    });

    const tea = await prisma.item.findFirstOrThrow({ where: { projectId: result.projectId, title: "Emerald tea" } });
    const water = await prisma.item.findFirstOrThrow({ where: { projectId: result.projectId, title: "Water" } });
    const recipe = await prisma.relationship.findFirstOrThrow({ where: { sourceItemId: tea.id, targetItemId: water.id } });
    expect(recipe).toMatchObject({ type: "made_from", quantity: 2 });

    const cottage2 = await prisma.item.findFirstOrThrow({ where: { projectId: result.projectId, title: "Cottage, level 2" } });
    expect(cottage2.conditions).toBe("Can only be built in summer.");
  });

  it("replaces only its own copy, and leaves the web demo alone", async () => {
    await seedDemoProject(USER); // the web portfolio
    await seedDemoProject(USER, gameDemo);
    await seedDemoProject(USER, gameDemo);
    const names = (await prisma.project.findMany({ where: { userId: USER } })).map((p) => p.name).sort();
    expect(names).toEqual(["Awesome Demo Portfolio", "Emerald Brew"]);
  });
});
