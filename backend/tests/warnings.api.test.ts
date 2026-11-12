import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own pair of users, so this file does not delete rows that other test files use in parallel
const USER_A = "00000000-0000-4000-8000-000000000070";
const USER_B = "00000000-0000-4000-8000-000000000071";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000070",
    "token-b": "00000000-0000-4000-8000-000000000071",
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

// Only removes the rows of the two test users (items and tasks go with their project)
async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

async function createProjectAs(headers: typeof asA) {
  const res = await request(app).post("/api/projects").set(headers).send({ name: "P", template: "web" });
  return res.body.id as string;
}

async function createItemAs(headers: typeof asA, projectId: string, type: string, extra = {}) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/items`)
    .set(headers)
    .send({ title: `My ${type}`, type, ...extra });
  return res.body.id as string;
}

async function getWarnings(projectId: string, headers: typeof asA) {
  return request(app).get(`/api/projects/${projectId}/warnings`).set(headers);
}

describe("GET /api/projects/:id/warnings", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/warnings`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for a project id that is not a uuid", async () => {
    const res = await request(app).get("/api/projects/not-a-uuid/warnings").set(asA);
    expect(res.status).toBe(400);
  });

  it("returns 404 for a project that does not exist", async () => {
    const res = await getWarnings(missingId, asA);
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's project and shows nothing about it", async () => {
    const projectId = await createProjectAs(asA);
    await createItemAs(asA, projectId, "page");

    const res = await getWarnings(projectId, asB);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Project not found" } });
  });

  it("returns an empty list for an empty project", async () => {
    const projectId = await createProjectAs(asA);

    const res = await getWarnings(projectId, asA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("warns about a page with no components and a function nothing triggers", async () => {
    const projectId = await createProjectAs(asA);
    const pageId = await createItemAs(asA, projectId, "page");
    const functionId = await createItemAs(asA, projectId, "function");

    const res = await getWarnings(projectId, asA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { rule: "page_without_components", itemId: pageId, itemTitle: "My page", message: "has no components" },
      { rule: "function_not_triggered", itemId: functionId, itemTitle: "My function", message: "is not triggered by anything" },
    ]);
  });

  it("removes the warning when the connection is made", async () => {
    const projectId = await createProjectAs(asA);
    const pageId = await createItemAs(asA, projectId, "page");
    const componentId = await createItemAs(asA, projectId, "component");

    await request(app)
      .post("/api/relationships")
      .set(asA)
      .send({ sourceItemId: componentId, targetItemId: pageId, type: "belongs_to" });

    const res = await getWarnings(projectId, asA);
    expect(res.body).toEqual([]);
  });

  it("warns about an MVP item with no tasks until a task is linked to it", async () => {
    const projectId = await createProjectAs(asA);
    const itemId = await createItemAs(asA, projectId, "design", { isMvp: true });

    const before = await getWarnings(projectId, asA);
    expect(before.body).toMatchObject([{ rule: "mvp_without_tasks", itemId }]);

    await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "Sketch", itemId });

    const after = await getWarnings(projectId, asA);
    expect(after.body).toEqual([]);
  });

  it("only looks at the project in the URL, not the user's other projects", async () => {
    const projectId = await createProjectAs(asA);
    const otherId = await createProjectAs(asA);
    await createItemAs(asA, otherId, "page");

    const res = await getWarnings(projectId, asA);
    expect(res.body).toEqual([]);
  });
});
