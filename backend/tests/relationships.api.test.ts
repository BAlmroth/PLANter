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
