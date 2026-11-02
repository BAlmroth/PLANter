import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own pair of users, so this file does not delete rows that other test files use in parallel
const USER_A = "00000000-0000-4000-8000-00000000000e";
const USER_B = "00000000-0000-4000-8000-00000000000f";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-00000000000e",
    "token-b": "00000000-0000-4000-8000-00000000000f",
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

// Only removes the rows of the two test users (items go with their project)
async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

// Creates a project through the API and returns its id
async function createProjectAs(headers: typeof asA) {
  const res = await request(app).post("/api/projects").set(headers).send({ name: "P", template: "web" });
  return res.body.id as string;
}

// Creates an item through the API and returns its id
async function createItemAs(headers: typeof asA, projectId: string, type: string, status?: string) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/items`)
    .set(headers)
    .send({ title: "Item", type, ...(status && { status }) });
  return res.body.id as string;
}

describe("GET /api/projects/:id/progress", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/progress`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for a project id that is not a uuid", async () => {
    const res = await request(app).get("/api/projects/not-a-uuid/progress").set(asA);
    expect(res.status).toBe(400);
  });

  it("returns 404 for a project that does not exist", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/progress`).set(asA);
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's project and shows nothing about it", async () => {
    const projectId = await createProjectAs(asA);
    await createItemAs(asA, projectId, "page", "done");

    const res = await request(app).get(`/api/projects/${projectId}/progress`).set(asB);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Project not found" } });
  });

  it("returns 0% with every category at 0% for an empty project", async () => {
    const projectId = await createProjectAs(asA);

    const res = await request(app).get(`/api/projects/${projectId}/progress`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ done: 0, total: 0, percent: 0 });
    expect(res.body.categories.every((c: { percent: number }) => c.percent === 0)).toBe(true);
  });

  it("counts done items per category and in total", async () => {
    const projectId = await createProjectAs(asA);
    await createItemAs(asA, projectId, "page", "done");
    await createItemAs(asA, projectId, "page", "planned");
    await createItemAs(asA, projectId, "component", "in_progress");
    await createItemAs(asA, projectId, "component", "done");

    const res = await request(app).get(`/api/projects/${projectId}/progress`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ done: 2, inProgress: 1, total: 4, percent: 50 });

    const page = res.body.categories.find((c: { key: string }) => c.key === "page");
    expect(page).toMatchObject({ done: 1, total: 2, percent: 50 });
    const component = res.body.categories.find((c: { key: string }) => c.key === "component");
    expect(component).toMatchObject({ done: 1, total: 2, percent: 50 });
  });

  it("reflects a status change made through the item route", async () => {
    const projectId = await createProjectAs(asA);
    const itemId = await createItemAs(asA, projectId, "function", "planned");

    await request(app).patch(`/api/items/${itemId}`).set(asA).send({ status: "done" });

    const res = await request(app).get(`/api/projects/${projectId}/progress`).set(asA);
    expect(res.body).toMatchObject({ done: 1, total: 1, percent: 100 });
  });
});
