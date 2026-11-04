import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...20 and ...21), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000020";
const USER_B = "00000000-0000-4000-8000-000000000021";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000020",
    "token-b": "00000000-0000-4000-8000-000000000021",
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

// Creates a project with an item for the given user
async function setup(userId = USER_A) {
  const project = await prisma.project.create({ data: { userId, name: "P", template: "web" } });
  const item = await prisma.item.create({ data: { projectId: project.id, type: "page", title: "Login" } });
  return { projectId: project.id, itemId: item.id };
}

describe("tasks API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/tasks`);
    expect(res.status).toBe(401);
  });

  it("creates a task linked to an item and lists it", async () => {
    const { projectId, itemId } = await setup();
    const created = await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "Build form", itemId });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "Build form", itemId, done: false, projectId });

    const list = await request(app).get(`/api/projects/${projectId}/tasks`).set(asA);
    expect(list.body).toHaveLength(1);
  });

  it("creates a task without an item, and rejects an empty title", async () => {
    const { projectId } = await setup();
    const ok = await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "Write README" });
    const bad = await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "  " });
    expect(ok.status).toBe(201);
    expect(ok.body.itemId).toBeNull();
    expect(bad.status).toBe(400);
  });

  it("lists open tasks before done tasks", async () => {
    const { projectId } = await setup();
    await prisma.task.createMany({
      data: [
        { projectId, title: "A done", done: true },
        { projectId, title: "B open" },
      ],
    });
    const list = await request(app).get(`/api/projects/${projectId}/tasks`).set(asA);
    expect(list.body.map((t: { title: string }) => t.title)).toEqual(["B open", "A done"]);
  });

  it("returns 404 when the item is in another project", async () => {
    const mine = await setup();
    const other = await setup();
    const res = await request(app)
      .post(`/api/projects/${mine.projectId}/tasks`)
      .set(asA)
      .send({ title: "X", itemId: other.itemId });
    expect(res.status).toBe(404);
  });

  it("updates done, title and unlinks the item", async () => {
    const { projectId, itemId } = await setup();
    const task = await prisma.task.create({ data: { projectId, itemId, title: "T" } });
    const res = await request(app).patch(`/api/tasks/${task.id}`).set(asA).send({ done: true, title: "T2", itemId: null });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ done: true, title: "T2", itemId: null });
  });

  it("deletes a task, and an item delete removes its tasks", async () => {
    const { projectId, itemId } = await setup();
    const task = await prisma.task.create({ data: { projectId, title: "T" } });
    const linked = await prisma.task.create({ data: { projectId, itemId, title: "L" } });
    expect((await request(app).delete(`/api/tasks/${task.id}`).set(asA)).status).toBe(204);
    await prisma.item.delete({ where: { id: itemId } });
    expect(await prisma.task.findUnique({ where: { id: linked.id } })).toBeNull();
  });

  it("gives user B 404 on user A's project and tasks", async () => {
    const { projectId } = await setup();
    const task = await prisma.task.create({ data: { projectId, title: "T" } });
    expect((await request(app).get(`/api/projects/${projectId}/tasks`).set(asB)).status).toBe(404);
    expect((await request(app).post(`/api/projects/${projectId}/tasks`).set(asB).send({ title: "X" })).status).toBe(404);
    expect((await request(app).patch(`/api/tasks/${task.id}`).set(asB).send({ done: true })).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${task.id}`).set(asB)).status).toBe(404);
    expect(await prisma.task.count({ where: { id: task.id } })).toBe(1);
  });
});
