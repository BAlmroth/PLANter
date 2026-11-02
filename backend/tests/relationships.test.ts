import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { createRelationship, wouldCreateCycle } from "../src/services/relationships.js";

// Own users (...0e and ...0f), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-00000000000e";
const USER_B = "00000000-0000-4000-8000-00000000000f";

async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}
beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

// Creates a project for a user with one item per given type, returns the items by type
// The generic T makes items.page a plain string (not string | undefined) for the types you pass in
async function setup<T extends string>(userId: string, types: T[]) {
  const project = await prisma.project.create({ data: { userId, name: "P", template: "web" } });
  const items = {} as Record<T, string>;
  for (const type of types) {
    const item = await prisma.item.create({ data: { projectId: project.id, type, title: type } });
    items[type] = item.id;
  }
  return { project, items };
}

describe("createRelationship", () => {
  it("creates an allowed relationship and takes projectId from the items", async () => {
    const { project, items } = await setup(USER_A, ["component", "page"]);
    const rel = await createRelationship(USER_A, {
      sourceItemId: items.component,
      targetItemId: items.page,
      type: "belongs_to",
    });
    expect(rel.projectId).toBe(project.id);
    expect(rel.type).toBe("belongs_to");
  });

  it("rejects a combination the template does not allow (400)", async () => {
    const { items } = await setup(USER_A, ["page", "design"]);
    await expect(
      createRelationship(USER_A, { sourceItemId: items.page, targetItemId: items.design, type: "triggers" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects the same relationship twice (400)", async () => {
    const { items } = await setup(USER_A, ["component", "page"]);
    const input = { sourceItemId: items.component, targetItemId: items.page, type: "belongs_to" };
    await createRelationship(USER_A, input);
    await expect(createRelationship(USER_A, input)).rejects.toMatchObject({ status: 400 });
  });

  it("returns 404 when the items belong to another user", async () => {
    const { items } = await setup(USER_A, ["component", "page"]);
    await expect(
      createRelationship(USER_B, { sourceItemId: items.component, targetItemId: items.page, type: "belongs_to" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns 404 when the items are in different projects of the same user", async () => {
    const first = await setup(USER_A, ["component"]);
    const second = await setup(USER_A, ["page"]);
    await expect(
      createRelationship(USER_A, {
        sourceItemId: first.items.component,
        targetItemId: second.items.page,
        type: "belongs_to",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns 404 when an item does not exist", async () => {
    const { items } = await setup(USER_A, ["component"]);
    await expect(
      createRelationship(USER_A, {
        sourceItemId: items.component,
        targetItemId: "11111111-1111-4111-8111-111111111111",
        type: "belongs_to",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("wouldCreateCycle", () => {
  const edge = (sourceItemId: string, targetItemId: string) => ({ sourceItemId, targetItemId });

  it("is false when nothing is connected", () => {
    expect(wouldCreateCycle([], "a", "b")).toBe(false);
  });

  it("detects a direct loop (b -> a exists, adding a -> b)", () => {
    expect(wouldCreateCycle([edge("b", "a")], "a", "b")).toBe(true);
  });

  it("detects a longer loop (b -> c -> a exists, adding a -> b)", () => {
    expect(wouldCreateCycle([edge("b", "c"), edge("c", "a")], "a", "b")).toBe(true);
  });

  it("is false for a chain in the same direction", () => {
    expect(wouldCreateCycle([edge("a", "c"), edge("c", "b")], "a", "b")).toBe(false);
  });

  it("does not run forever on an existing loop elsewhere", () => {
    expect(wouldCreateCycle([edge("x", "y"), edge("y", "x")], "a", "x")).toBe(false);
  });
});

describe("createRelationship cycles", () => {
  it("rejects a loop for a type with allowCycles: false (400)", async () => {
    const { project } = await setup(USER_A, []);
    const [a, b] = await Promise.all(
      ["component", "component"].map((type) =>
        prisma.item.create({ data: { projectId: project.id, type, title: type } }),
      ),
    );
    await createRelationship(USER_A, { sourceItemId: a!.id, targetItemId: b!.id, type: "belongs_to" });
    await expect(
      createRelationship(USER_A, { sourceItemId: b!.id, targetItemId: a!.id, type: "belongs_to" }),
    ).rejects.toMatchObject({ status: 400, message: "This connection would create a loop" });
  });

  it("allows a loop for a type with allowCycles: true", async () => {
    const { project } = await setup(USER_A, []);
    const [a, b] = await Promise.all(
      ["function", "function"].map((type) =>
        prisma.item.create({ data: { projectId: project.id, type, title: type } }),
      ),
    );
    await createRelationship(USER_A, { sourceItemId: a!.id, targetItemId: b!.id, type: "triggers" });
    const back = await createRelationship(USER_A, { sourceItemId: b!.id, targetItemId: a!.id, type: "triggers" });
    expect(back.type).toBe("triggers");
  });
});

describe("createRelationship with many connections", () => {
  // Several items of the same type in one project, returned as a list of ids
  async function createItems(projectId: string, type: string, count: number) {
    const items = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        prisma.item.create({ data: { projectId, type, title: `${type} ${i + 1}` } }),
      ),
    );
    return items.map((item) => item.id);
  }

  it("lets one component be used by many pages", async () => {
    const { project, items } = await setup(USER_A, ["component"]);
    const pages = await createItems(project.id, "page", 3);

    for (const pageId of pages) {
      await createRelationship(USER_A, { sourceItemId: items.component, targetItemId: pageId, type: "belongs_to" });
    }

    expect(await prisma.relationship.count({ where: { sourceItemId: items.component } })).toBe(3);
  });

  it("lets one page use many components", async () => {
    const { project, items } = await setup(USER_A, ["page"]);
    const components = await createItems(project.id, "component", 3);

    for (const componentId of components) {
      await createRelationship(USER_A, { sourceItemId: componentId, targetItemId: items.page, type: "belongs_to" });
    }

    expect(await prisma.relationship.count({ where: { targetItemId: items.page } })).toBe(3);
  });
});
