import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...30 and ...31), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000030";
const USER_B = "00000000-0000-4000-8000-000000000031";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000030",
    "token-b": "00000000-0000-4000-8000-000000000031",
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
  const sprint = await prisma.sprint.create({ data: { projectId: project.id, name: "Sprint 1" } });
  return { projectId: project.id, sprintId: sprint.id };
}

describe("sprints API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/sprints`);
    expect(res.status).toBe(401);
  });

  it("creates, lists, renames and deletes a sprint", async () => {
    const { projectId } = await setup();
    const created = await request(app).post(`/api/projects/${projectId}/sprints`).set(asA).send({ name: "Sprint 2" });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/projects/${projectId}/sprints`).set(asA);
    expect(list.body.map((s: { name: string }) => s.name)).toEqual(["Sprint 1", "Sprint 2"]);

    const renamed = await request(app).patch(`/api/sprints/${created.body.id}`).set(asA).send({ name: "Sprint two" });
    expect(renamed.body.name).toBe("Sprint two");

    expect((await request(app).delete(`/api/sprints/${created.body.id}`).set(asA)).status).toBe(204);
  });

  it("rejects an empty name and an empty update", async () => {
    const { projectId, sprintId } = await setup();
    expect((await request(app).post(`/api/projects/${projectId}/sprints`).set(asA).send({ name: " " })).status).toBe(400);
    expect((await request(app).patch(`/api/sprints/${sprintId}`).set(asA).send({})).status).toBe(400);
  });

  it("keeps the tasks of a deleted sprint, without a sprint", async () => {
    const { projectId, sprintId } = await setup();
    const task = await prisma.task.create({ data: { projectId, sprintId, title: "T" } });
    await request(app).delete(`/api/sprints/${sprintId}`).set(asA);
    expect(await prisma.task.findUnique({ where: { id: task.id } })).toMatchObject({ sprintId: null });
  });

  it("assigns a task to a sprint and removes it again", async () => {
    const { projectId, sprintId } = await setup();
    const created = await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "T", sprintId });
    expect(created.body.sprintId).toBe(sprintId);
    const removed = await request(app).patch(`/api/tasks/${created.body.id}`).set(asA).send({ sprintId: null });
    expect(removed.body.sprintId).toBeNull();
  });

  it("returns 404 when a task is given a sprint from another project", async () => {
    const mine = await setup();
    const other = await setup(USER_B);
    const task = await prisma.task.create({ data: { projectId: mine.projectId, title: "T" } });
    const onCreate = await request(app)
      .post(`/api/projects/${mine.projectId}/tasks`)
      .set(asA)
      .send({ title: "X", sprintId: other.sprintId });
    const onUpdate = await request(app).patch(`/api/tasks/${task.id}`).set(asA).send({ sprintId: other.sprintId });
    expect(onCreate.status).toBe(404);
    expect(onUpdate.status).toBe(404);
  });

  it("gives user B 404 on user A's sprints", async () => {
    const { projectId, sprintId } = await setup();
    expect((await request(app).get(`/api/projects/${projectId}/sprints`).set(asB)).status).toBe(404);
    expect((await request(app).post(`/api/projects/${projectId}/sprints`).set(asB).send({ name: "X" })).status).toBe(404);
    expect((await request(app).patch(`/api/sprints/${sprintId}`).set(asB).send({ name: "X" })).status).toBe(404);
    expect((await request(app).delete(`/api/sprints/${sprintId}`).set(asB)).status).toBe(404);
    expect(await prisma.sprint.count({ where: { id: sprintId } })).toBe(1);
  });
});
