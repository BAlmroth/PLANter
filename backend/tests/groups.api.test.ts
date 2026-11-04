import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...40 and ...41), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000040";
const USER_B = "00000000-0000-4000-8000-000000000041";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000040",
    "token-b": "00000000-0000-4000-8000-000000000041",
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

async function setup(userId = USER_A) {
  const project = await prisma.project.create({ data: { userId, name: "P", template: "web" } });
  const group = await prisma.group.create({ data: { projectId: project.id, name: "Navigation" } });
  const item = await prisma.item.create({ data: { projectId: project.id, type: "component", title: "Header" } });
  return { projectId: project.id, groupId: group.id, itemId: item.id };
}

describe("groups API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/groups`);
    expect(res.status).toBe(401);
  });

  it("creates, lists, edits and deletes a group", async () => {
    const { projectId } = await setup();
    const created = await request(app)
      .post(`/api/projects/${projectId}/groups`)
      .set(asA)
      .send({ name: "Forms", description: "Everything with inputs" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Forms", description: "Everything with inputs", itemIds: [] });

    const list = await request(app).get(`/api/projects/${projectId}/groups`).set(asA);
    expect(list.body.map((g: { name: string }) => g.name)).toEqual(["Navigation", "Forms"]);

    const edited = await request(app).patch(`/api/groups/${created.body.id}`).set(asA).send({ description: "" });
    expect(edited.body).toMatchObject({ name: "Forms", description: "" });

    expect((await request(app).delete(`/api/groups/${created.body.id}`).set(asA)).status).toBe(204);
  });

  it("rejects an empty name, a too long description and an empty update", async () => {
    const { projectId, groupId } = await setup();
    const url = `/api/projects/${projectId}/groups`;
    expect((await request(app).post(url).set(asA).send({ name: " " })).status).toBe(400);
    expect((await request(app).post(url).set(asA).send({ name: "G", description: "x".repeat(501) })).status).toBe(400);
    expect((await request(app).patch(`/api/groups/${groupId}`).set(asA).send({})).status).toBe(400);
  });

  it("adds an item to several groups, and removes it from one", async () => {
    const { projectId, groupId, itemId } = await setup();
    const other = await prisma.group.create({ data: { projectId, name: "Layout" } });

    expect((await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asA)).status).toBe(204);
    // Adding the same item twice is not an error and does not add a second row
    expect((await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asA)).status).toBe(204);
    await request(app).put(`/api/groups/${other.id}/items/${itemId}`).set(asA);

    let list = await request(app).get(`/api/projects/${projectId}/groups`).set(asA);
    expect(list.body.map((g: { itemIds: string[] }) => g.itemIds)).toEqual([[itemId], [itemId]]);

    expect((await request(app).delete(`/api/groups/${groupId}/items/${itemId}`).set(asA)).status).toBe(204);
    list = await request(app).get(`/api/projects/${projectId}/groups`).set(asA);
    expect(list.body.map((g: { itemIds: string[] }) => g.itemIds)).toEqual([[], [itemId]]);
    expect(await prisma.item.count({ where: { id: itemId } })).toBe(1);
  });

  it("keeps the items of a deleted group", async () => {
    const { groupId, itemId } = await setup();
    await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asA);
    await request(app).delete(`/api/groups/${groupId}`).set(asA);
    expect(await prisma.item.count({ where: { id: itemId } })).toBe(1);
    expect(await prisma.groupItem.count({ where: { itemId } })).toBe(0);
  });

  it("removes the item from its groups when the item is deleted", async () => {
    const { groupId, itemId } = await setup();
    await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asA);
    await request(app).delete(`/api/items/${itemId}`).set(asA);
    expect(await prisma.group.count({ where: { id: groupId } })).toBe(1);
    expect(await prisma.groupItem.count({ where: { groupId } })).toBe(0);
  });

  it("returns 404 when an item from another project is added to a group", async () => {
    const mine = await setup();
    const otherProject = await setup();
    const theirs = await setup(USER_B);
    expect((await request(app).put(`/api/groups/${mine.groupId}/items/${otherProject.itemId}`).set(asA)).status).toBe(404);
    expect((await request(app).put(`/api/groups/${mine.groupId}/items/${theirs.itemId}`).set(asA)).status).toBe(404);
    expect(await prisma.groupItem.count({ where: { groupId: mine.groupId } })).toBe(0);
  });

  it("gives user B 404 on user A's groups", async () => {
    const { projectId, groupId, itemId } = await setup();
    await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asA);

    expect((await request(app).get(`/api/projects/${projectId}/groups`).set(asB)).status).toBe(404);
    expect((await request(app).post(`/api/projects/${projectId}/groups`).set(asB).send({ name: "X" })).status).toBe(404);
    expect((await request(app).patch(`/api/groups/${groupId}`).set(asB).send({ name: "X" })).status).toBe(404);
    expect((await request(app).delete(`/api/groups/${groupId}/items/${itemId}`).set(asB)).status).toBe(404);
    expect((await request(app).put(`/api/groups/${groupId}/items/${itemId}`).set(asB)).status).toBe(404);
    expect((await request(app).delete(`/api/groups/${groupId}`).set(asB)).status).toBe(404);
    expect(await prisma.group.count({ where: { id: groupId } })).toBe(1);
    expect(await prisma.groupItem.count({ where: { groupId } })).toBe(1);
  });
});
