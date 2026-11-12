import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...74 and ...75), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000074";
const USER_B = "00000000-0000-4000-8000-000000000075";

// Fake Supabase login: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000074",
    "token-b": "00000000-0000-4000-8000-000000000075",
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

// A project with one item and one palette color
async function setup(userId = USER_A) {
  const project = await prisma.project.create({ data: { userId, name: "P", template: "web" } });
  const item = await prisma.item.create({ data: { projectId: project.id, type: "page", title: "Login" } });
  const color = await prisma.projectColor.create({ data: { projectId: project.id, hex: "#3E6554" } });
  return { projectId: project.id, itemId: item.id, colorId: color.id };
}

const link = (itemId: string, colorId: string, headers = asA) =>
  request(app).put(`/api/items/${itemId}/colors/${colorId}`).set(headers);
const links = (projectId: string, headers = asA) =>
  request(app).get(`/api/projects/${projectId}/item-colors`).set(headers);

describe("item colors API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).put(`/api/items/${missingId}/colors/${missingId}`);
    expect(res.status).toBe(401);
  });

  it("links, lists and unlinks a color, and the color stays in the palette", async () => {
    const { projectId, itemId, colorId } = await setup();

    const linked = await link(itemId, colorId);
    expect(linked.status).toBe(200);
    expect(linked.body).toEqual({ itemId, colorId });
    expect((await links(projectId)).body).toEqual([{ itemId, colorId }]);

    const unlinked = await request(app).delete(`/api/items/${itemId}/colors/${colorId}`).set(asA);
    expect(unlinked.status).toBe(204);
    expect((await links(projectId)).body).toEqual([]);
    expect(await prisma.projectColor.count({ where: { projectId } })).toBe(1);
  });

  it("linking the same color twice does nothing", async () => {
    const { projectId, itemId, colorId } = await setup();
    await link(itemId, colorId);
    expect((await link(itemId, colorId)).status).toBe(200);
    expect((await links(projectId)).body).toHaveLength(1);
  });

  it("returns 404 when unlinking a color that is not linked", async () => {
    const { itemId, colorId } = await setup();
    const res = await request(app).delete(`/api/items/${itemId}/colors/${colorId}`).set(asA);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a color from another project, even the same user's", async () => {
    const { itemId } = await setup();
    const other = await setup();
    const res = await link(itemId, other.colorId);
    expect(res.status).toBe(404);
    expect(await prisma.itemColor.count()).toBe(0);
  });

  it("returns 404 for another user's item, color and project, and links nothing", async () => {
    const mine = await setup();
    const theirs = await setup(USER_B);

    expect((await link(mine.itemId, mine.colorId, asB)).status).toBe(404);
    expect((await link(mine.itemId, theirs.colorId)).status).toBe(404);
    expect((await link(theirs.itemId, theirs.colorId)).status).toBe(404);
    expect((await links(mine.projectId, asB)).status).toBe(404);
    expect(await prisma.itemColor.count()).toBe(0);
  });

  it("rejects ids that are not UUIDs", async () => {
    const res = await request(app).put("/api/items/abc/colors/def").set(asA);
    expect(res.status).toBe(400);
  });

  it("removes the links when the color is deleted, and keeps the item", async () => {
    const { projectId, itemId, colorId } = await setup();
    await link(itemId, colorId);
    expect((await request(app).delete(`/api/colors/${colorId}`).set(asA)).status).toBe(204);
    expect((await links(projectId)).body).toEqual([]);
    expect(await prisma.item.count({ where: { id: itemId } })).toBe(1);
  });

  it("removes the links when the item is deleted, and keeps the color", async () => {
    const { projectId, itemId, colorId } = await setup();
    await link(itemId, colorId);
    expect((await request(app).delete(`/api/items/${itemId}`).set(asA)).status).toBe(204);
    expect((await links(projectId)).body).toEqual([]);
    expect(await prisma.projectColor.count({ where: { id: colorId } })).toBe(1);
  });

  it("the database refuses a link between an item and a color of different projects", async () => {
    const one = await setup();
    const two = await setup();
    // Straight through Prisma, skipping the service: only the composite foreign keys can stop this
    await expect(
      prisma.itemColor.create({ data: { itemId: one.itemId, colorId: two.colorId, projectId: one.projectId } }),
    ).rejects.toThrow();
  });
});
