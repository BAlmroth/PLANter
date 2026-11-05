import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { seedDemoProject } from "../src/seed/seedDemo.js";
import {
  DEMO_COLUMN_WIDTH, DEMO_ROW_HEIGHT, demoGroups, demoInspirations, demoItems, demoProject, demoRelationships, demoSprints, demoBacklogTasks,
} from "../src/seed/demoPortfolio.js";
import { relationshipRuleSchema } from "../src/schemas/relationships.js";
import { wouldCreateCycle } from "../src/services/relationships.js";
import { calculateProgress } from "../src/services/progress.js";
import { getTemplate } from "../src/templates/index.js";

// Own user (...50), because test files share one database
const USER = "00000000-0000-4000-8000-000000000050";
const template = getTemplate("web")!;
const byRef = new Map(demoItems.map((i) => [i.ref, i]));

describe("demo portfolio seed data", () => {
  it("has unique refs and only known item types", () => {
    expect(byRef.size).toBe(demoItems.length);
    const keys = template.itemTypes.map((t) => t.key);
    for (const item of demoItems) expect(keys).toContain(item.type);
  });

  it("uses every item type, every relationship type and every status", () => {
    expect(new Set(demoItems.map((i) => i.type))).toEqual(new Set(template.itemTypes.map((t) => t.key)));
    expect(new Set(demoRelationships.map((r) => r.type))).toEqual(new Set(template.relationshipTypes.map((t) => t.key)));
    expect(new Set(demoItems.map((i) => i.status))).toEqual(new Set(["planned", "in_progress", "done"]));
  });

  it("only has relationships the template allows, between existing items", () => {
    const rule = relationshipRuleSchema(template);
    for (const r of demoRelationships) {
      const source = byRef.get(r.source);
      const target = byRef.get(r.target);
      expect(source, r.source).toBeDefined();
      expect(target, r.target).toBeDefined();
      expect(r.source).not.toBe(r.target);
      expect(rule.safeParse({ sourceType: source!.type, type: r.type, targetType: target!.type }).success, `${r.source} ${r.type} ${r.target}`).toBe(true);
    }
  });

  it("gives every item its own spot on the map", () => {
    const spots = demoItems.map((i) => `${i.col},${i.row}`);
    expect(new Set(spots).size).toBe(demoItems.length);
    for (const i of demoItems) {
      expect(Number.isInteger(i.col) && i.col >= 0, i.ref).toBe(true);
      expect(Number.isInteger(i.row) && i.row >= 0, i.ref).toBe(true);
    }
  });

  it("puts an item beside the page or component it belongs to", () => {
    // A component and the page it belongs to are never more than one column apart,
    // unless the component is shared (it belongs to more than one place)
    const targets = (ref: string) => demoRelationships.filter((r) => r.source === ref && r.type === "belongs_to");
    for (const r of demoRelationships.filter((x) => x.type === "belongs_to" && targets(x.source).length === 1)) {
      const source = byRef.get(r.source)!;
      const target = byRef.get(r.target)!;
      expect(Math.abs(source.col - target.col), `${r.source} -> ${r.target}`).toBeLessThanOrEqual(1);
    }
  });

  it("has no duplicate relationships and no loops for types that forbid them", () => {
    const seen = new Set(demoRelationships.map((r) => `${r.source}|${r.target}|${r.type}`));
    expect(seen.size).toBe(demoRelationships.length);

    for (const type of template.relationshipTypes.filter((t) => !t.allowCycles).map((t) => t.key)) {
      const edges: { sourceItemId: string; targetItemId: string }[] = [];
      for (const r of demoRelationships.filter((x) => x.type === type)) {
        expect(wouldCreateCycle(edges, r.source, r.target), `${r.source} -> ${r.target}`).toBe(false);
        edges.push({ sourceItemId: r.source, targetItemId: r.target });
      }
    }
  });

  it("points groups and tasks at existing items, and respects Zod length limits and the http(s) rule", () => {
    for (const g of demoGroups) for (const ref of g.items) expect(byRef.has(ref), ref).toBe(true);
    for (const t of [...demoSprints.flatMap((s) => s.tasks), ...demoBacklogTasks]) {
      if (t.item) expect(byRef.has(t.item), t.item).toBe(true);
    }
    for (const i of demoItems) {
      expect(i.title.length).toBeLessThanOrEqual(100);
      expect((i.description ?? "").length).toBeLessThanOrEqual(500);
    }
    expect(demoProject.description.length).toBeLessThanOrEqual(500);
    const urls = [...demoItems.flatMap((i) => i.details ?? []), ...demoInspirations].flatMap((d) => (d.url ? [d.url] : []));
    for (const url of urls) expect(url).toMatch(/^https?:\/\//);
  });
});

describe("seedDemoProject (database)", () => {
  beforeEach(() => prisma.project.deleteMany({ where: { userId: USER } }));
  afterAll(async () => {
    await prisma.project.deleteMany({ where: { userId: USER } });
    await prisma.$disconnect();
  });

  it("creates the whole project for the user", async () => {
    const result = await seedDemoProject(USER);
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: result.projectId },
      include: { _count: { select: { items: true, relationships: true, groups: true, sprints: true, tasks: true, inspirations: true } } },
    });
    expect(project.userId).toBe(USER);
    expect(project.name).toBe("Awesome Demo Portfolio");
    expect(project._count).toEqual({
      items: demoItems.length,
      relationships: demoRelationships.length,
      groups: demoGroups.length,
      sprints: demoSprints.length,
      tasks: demoSprints.flatMap((s) => s.tasks).length + demoBacklogTasks.length,
      inspirations: demoInspirations.length,
    });
    // Positions from the seed data are saved (grid steps times the demo column width and row height)
    const home = await prisma.item.findFirstOrThrow({ where: { projectId: result.projectId, title: "Home" } });
    const homeSeed = demoItems.find((i) => i.ref === "pageHome")!;
    expect([home.positionX, home.positionY]).toEqual([homeSeed.col * DEMO_COLUMN_WIDTH, homeSeed.row * DEMO_ROW_HEIGHT]);
    expect(await prisma.groupItem.count({ where: { projectId: result.projectId } })).toBe(
      demoGroups.reduce((n, g) => n + g.items.length, 0),
    );
    expect(await prisma.itemDetail.count({ where: { item: { projectId: result.projectId } } })).toBeGreaterThan(0);

    // The progress calculation works on it and gives a number between 0 and 100
    const items = await prisma.item.findMany({ where: { projectId: result.projectId } });
    const progress = calculateProgress(template, items);
    expect(progress.total).toBe(demoItems.length);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThan(100);
  });

  it("can be run again without making a second copy", async () => {
    await seedDemoProject(USER);
    await seedDemoProject(USER);
    expect(await prisma.project.count({ where: { userId: USER } })).toBe(1);
  });
});
