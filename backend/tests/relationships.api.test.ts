import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...10 and ...11), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000010";
const USER_B = "00000000-0000-4000-8000-000000000011";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000010",
    "token-b": "00000000-0000-4000-8000-000000000011",
  };
  return {
    supabase: {
      auth: {
        getUser: async (token: string) => {
          const id = users[token];
          return id
            ? { data: { user: { id } }, error: null }
            : { data: { user: null }, error: new Error("invalid token") };
        },
      },
    },
  };
});

const asA = { Authorization: "Bearer token-a" };
const asB = { Authorization: "Bearer token-b" };
const missingId = "11111111-1111-4111-8111-111111111111";

async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}
beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

// Creates a project for user A with a component and a page, returns their ids
async function setup() {
  const project = await prisma.project.create({ data: { userId: USER_A, name: "P", template: "web" } });
  const component = await prisma.item.create({ data: { projectId: project.id, type: "component", title: "Button" } });
  const page = await prisma.item.create({ data: { projectId: project.id, type: "page", title: "Login" } });
  return { projectId: project.id, componentId: component.id, pageId: page.id };
}

describe("POST /api/relationships", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/relationships").send({});
    expect(res.status).toBe(401);
  });

  it("creates a relationship and ignores a projectId in the body", async () => {
    const { projectId, componentId, pageId } = await setup();
    const res = await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: componentId, targetItemId: pageId, type: "belongs_to", projectId: missingId });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ projectId, sourceItemId: componentId, targetItemId: pageId, type: "belongs_to" });
  });

  it("returns 400 for an invalid body", async () => {
    const { componentId } = await setup();
    const res = await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: componentId, targetItemId: componentId, type: "belongs_to" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a combination the template does not allow", async () => {
    const { componentId, pageId } = await setup();
    const res = await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: pageId, targetItemId: componentId, type: "belongs_to" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for another user's items, and creates nothing", async () => {
    const { projectId, componentId, pageId } = await setup();
    const res = await request(app)
      .post("/api/relationships")
      .set(asB)
      .send({ sourceItemId: componentId, targetItemId: pageId, type: "belongs_to" });
    expect(res.status).toBe(404);
    expect(await prisma.relationship.count({ where: { projectId } })).toBe(0);
  });
});

describe("POST /api/relationships in a game project", () => {
  // Same route and service as web: the rules come from the game template
  async function gameSetup() {
    const project = await prisma.project.create({ data: { userId: USER_A, name: "G", template: "game" } });
    const create = (type: string, title: string) =>
      prisma.item.create({ data: { projectId: project.id, type, title } });
    return { key: await create("inventory", "Castle key"), quest: await create("quest", "Find the key"), next: await create("quest", "Storm the castle") };
  }
  const connect = (sourceItemId: string, targetItemId: string, type: string) =>
    request(app).post("/api/relationships").set(asA).send({ sourceItemId, targetItemId, type });

  it("allows a combination from the game template", async () => {
    const { key, quest } = await gameSetup();
    expect((await connect(key.id, quest.id, "unlocks")).status).toBe(201);
  });

  it("rejects a web relationship type in a game project", async () => {
    const { quest, next } = await gameSetup();
    expect((await connect(quest.id, next.id, "belongs_to")).status).toBe(400);
  });

  it("rejects a progression loop (soft-lock) with 400", async () => {
    const { quest, next } = await gameSetup();
    expect((await connect(quest.id, next.id, "unlocks")).status).toBe(201);
    // "Storm the castle" unlocks "Find the key", which already unlocks "Storm the castle"
    expect((await connect(next.id, quest.id, "unlocks")).status).toBe(400);
  });

  it("rejects a recipe loop with 400", async () => {
    const project = await prisma.project.create({ data: { userId: USER_A, name: "G", template: "game" } });
    const create = (title: string) => prisma.item.create({ data: { projectId: project.id, type: "inventory", title } });
    const [water, coffee, tea] = [await create("Water"), await create("Coffee"), await create("Tea")];
    expect((await connect(coffee.id, water.id, "made_from")).status).toBe(201);
    expect((await connect(tea.id, coffee.id, "made_from")).status).toBe(201);
    // Water made from Tea: Tea needs Coffee, Coffee needs Water, so Water would need itself
    expect((await connect(water.id, tea.id, "made_from")).status).toBe(400);
  });

  it("allows an upgrade and rejects an upgrade loop with 400", async () => {
    const project = await prisma.project.create({ data: { userId: USER_A, name: "G", template: "game" } });
    const create = (title: string) => prisma.item.create({ data: { projectId: project.id, type: "location", title } });
    const [house1, house2] = [await create("House 1"), await create("House 2")];
    expect((await connect(house1.id, house2.id, "upgrades_to")).status).toBe(201);
    expect((await connect(house2.id, house1.id, "upgrades_to")).status).toBe(400);
  });

  it("lets a quest unlock inventory, and rejects an unlock loop through mixed types", async () => {
    const { key, quest } = await gameSetup();
    // "Find the key" unlocks the Castle key (now for sale), the key unlocks the quest again: a soft-lock
    expect((await connect(quest.id, key.id, "unlocks")).status).toBe(201);
    expect((await connect(key.id, quest.id, "unlocks")).status).toBe(400);
  });

  it("allows a location built from inventory, but not the other way round", async () => {
    const project = await prisma.project.create({ data: { userId: USER_A, name: "G", template: "game" } });
    const house = await prisma.item.create({ data: { projectId: project.id, type: "location", title: "House 2" } });
    const wood = await prisma.item.create({ data: { projectId: project.id, type: "inventory", title: "Wood" } });
    expect((await connect(house.id, wood.id, "made_from")).status).toBe(201);
    expect((await connect(wood.id, house.id, "made_from")).status).toBe(400);
  });
});

describe("GET /api/projects/:projectId/relationships", () => {
  it("lists the relationships of the project", async () => {
    const { projectId, componentId, pageId } = await setup();
    await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: componentId, targetItemId: pageId, type: "belongs_to" });
    const res = await request(app).get(`/api/projects/${projectId}/relationships`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("returns 404 for another user's project", async () => {
    const { projectId } = await setup();
    const res = await request(app).get(`/api/projects/${projectId}/relationships`).set(asB);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/relationships/:id", () => {
  async function createOne() {
    const ids = await setup();
    const res = await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: ids.componentId, targetItemId: ids.pageId, type: "belongs_to" });
    return res.body.id as string;
  }

  it("returns 404 for another user, and keeps the relationship", async () => {
    const id = await createOne();
    const res = await request(app).delete(`/api/relationships/${id}`).set(asB);
    expect(res.status).toBe(404);
    expect(await prisma.relationship.count({ where: { id } })).toBe(1);
  });

  it("deletes the relationship for its owner", async () => {
    const id = await createOne();
    const res = await request(app).delete(`/api/relationships/${id}`).set(asA);
    expect(res.status).toBe(204);
    expect(await prisma.relationship.count({ where: { id } })).toBe(0);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`/api/relationships/${missingId}`).set(asA);
    expect(res.status).toBe(404);
  });
});

describe("amounts on connections (quantity)", () => {
  // A game project with House 2 (location), Wood and Gold (inventory)
  async function quantitySetup() {
    const project = await prisma.project.create({ data: { userId: USER_A, name: "G", template: "game" } });
    const create = (type: string, title: string) =>
      prisma.item.create({ data: { projectId: project.id, type, title } });
    return {
      house: await create("location", "House 2"),
      house1: await create("location", "House 1"),
      wood: await create("inventory", "Wood"),
      gold: await create("inventory", "Gold"),
    };
  }
  const post = (body: object) => request(app).post("/api/relationships").set(asA).send(body);

  it("saves an amount on a type that allows it", async () => {
    const { house, wood, gold } = await quantitySetup();
    const made = await post({ sourceItemId: house.id, targetItemId: wood.id, type: "made_from", quantity: 20 });
    expect(made.status).toBe(201);
    expect(made.body.quantity).toBe(20);
    const costs = await post({ sourceItemId: house.id, targetItemId: gold.id, type: "costs", quantity: 1000 });
    expect(costs.status).toBe(201);
    expect(costs.body.quantity).toBe(1000);
  });

  it("saves no amount when none is sent", async () => {
    const { house, wood } = await quantitySetup();
    const res = await post({ sourceItemId: house.id, targetItemId: wood.id, type: "made_from" });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBeNull();
  });

  it("rejects an amount on a type without hasQuantity, and creates nothing", async () => {
    const { house, house1 } = await quantitySetup();
    const res = await post({ sourceItemId: house1.id, targetItemId: house.id, type: "upgrades_to", quantity: 2 });
    expect(res.status).toBe(400);
    expect(await prisma.relationship.count({ where: { sourceItemId: house1.id } })).toBe(0);
  });

  it.each([0, -3, 1.5, 10000, "20"])("rejects the amount %s with 400", async (quantity) => {
    const { house, wood } = await quantitySetup();
    const res = await post({ sourceItemId: house.id, targetItemId: wood.id, type: "made_from", quantity });
    expect(res.status).toBe(400);
  });

  it("is also blocked by the database CHECK if Zod is skipped", async () => {
    const { house, wood } = await quantitySetup();
    await expect(
      prisma.relationship.create({
        data: { projectId: house.projectId, sourceItemId: house.id, targetItemId: wood.id, type: "made_from", quantity: 0 },
      }),
    ).rejects.toThrow();
  });

  describe("PATCH /api/relationships/:id", () => {
    async function madeFrom() {
      const items = await quantitySetup();
      const res = await post({ sourceItemId: items.house.id, targetItemId: items.wood.id, type: "made_from", quantity: 20 });
      return { ...items, id: res.body.id as string };
    }
    const patch = (id: string, body: object, headers = asA) =>
      request(app).patch(`/api/relationships/${id}`).set(headers).send(body);

    it("returns 401 without a token", async () => {
      const res = await request(app).patch(`/api/relationships/${missingId}`).send({ quantity: 1 });
      expect(res.status).toBe(401);
    });

    it("changes the amount, and null removes it", async () => {
      const { id } = await madeFrom();
      const changed = await patch(id, { quantity: 25 });
      expect(changed.status).toBe(200);
      expect(changed.body.quantity).toBe(25);
      const cleared = await patch(id, { quantity: null });
      expect(cleared.status).toBe(200);
      expect(cleared.body.quantity).toBeNull();
    });

    it("only changes the amount, never the items or the type", async () => {
      const { id, house, wood, gold } = await madeFrom();
      const res = await patch(id, { quantity: 5, type: "costs", targetItemId: gold.id });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ sourceItemId: house.id, targetItemId: wood.id, type: "made_from", quantity: 5 });
    });

    it("returns 400 for an empty body or a bad amount", async () => {
      const { id } = await madeFrom();
      expect((await patch(id, {})).status).toBe(400);
      expect((await patch(id, { quantity: 0 })).status).toBe(400);
    });

    it("returns 400 for an amount on a type without hasQuantity, but allows null", async () => {
      const { house, house1 } = await quantitySetup();
      const upgrade = await post({ sourceItemId: house1.id, targetItemId: house.id, type: "upgrades_to" });
      expect((await patch(upgrade.body.id, { quantity: 3 })).status).toBe(400);
      expect((await patch(upgrade.body.id, { quantity: null })).status).toBe(200);
    });

    it("returns 404 for another user's connection, and changes nothing", async () => {
      const { id } = await madeFrom();
      const res = await patch(id, { quantity: 1 }, asB);
      expect(res.status).toBe(404);
      expect((await prisma.relationship.findUnique({ where: { id } }))?.quantity).toBe(20);
    });

    it("returns 404 for a connection that does not exist", async () => {
      expect((await patch(missingId, { quantity: 1 })).status).toBe(404);
    });
  });
});
