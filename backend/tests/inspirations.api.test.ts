import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...60 and ...61), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000060";
const USER_B = "00000000-0000-4000-8000-000000000061";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000060",
    "token-b": "00000000-0000-4000-8000-000000000061",
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
  return { projectId: project.id };
}

describe("inspirations API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/inspirations`);
    expect(res.status).toBe(401);
  });

  it("creates, lists and deletes inspiration", async () => {
    const { projectId } = await setup();
    const url = `/api/projects/${projectId}/inspirations`;
    const created = await request(app).post(url).set(asA).send({ title: "Nice site", url: "https://example.com" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "Nice site", url: "https://example.com", text: null });

    const list = await request(app).get(url).set(asA);
    expect(list.body).toHaveLength(1);

    expect((await request(app).delete(`/api/inspirations/${created.body.id}`).set(asA)).status).toBe(204);
    expect((await request(app).get(url).set(asA)).body).toHaveLength(0);
  });

  it("edits inspiration and clears the url and text with an empty string", async () => {
    const { projectId } = await setup();
    const created = await request(app)
      .post(`/api/projects/${projectId}/inspirations`)
      .set(asA)
      .send({ title: "Old", url: "https://example.com", text: "Notes" });

    const edited = await request(app).patch(`/api/inspirations/${created.body.id}`).set(asA).send({ title: "New" });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ title: "New", url: "https://example.com", text: "Notes" });

    const cleared = await request(app).patch(`/api/inspirations/${created.body.id}`).set(asA).send({ url: "", text: "" });
    expect(cleared.body).toMatchObject({ title: "New", url: null, text: null });
  });

  it("rejects an empty title, non-http links and too long text", async () => {
    const { projectId } = await setup();
    const url = `/api/projects/${projectId}/inspirations`;
    expect((await request(app).post(url).set(asA).send({ title: " " })).status).toBe(400);
    expect((await request(app).post(url).set(asA).send({ title: "X", url: "javascript:alert(1)" })).status).toBe(400);
    expect((await request(app).post(url).set(asA).send({ title: "X", url: "ftp://example.com" })).status).toBe(400);
    expect((await request(app).post(url).set(asA).send({ title: "X", text: "x".repeat(2001) })).status).toBe(400);

    const created = await request(app).post(url).set(asA).send({ title: "Y" });
    const edit = (body: object) => request(app).patch(`/api/inspirations/${created.body.id}`).set(asA).send(body);
    expect((await edit({})).status).toBe(400);
    expect((await edit({ title: " " })).status).toBe(400);
    expect((await edit({ url: "javascript:alert(1)" })).status).toBe(400);
  });

  it("answers 404 for another user's project and inspiration", async () => {
    const { projectId } = await setup(USER_A);
    const created = await request(app).post(`/api/projects/${projectId}/inspirations`).set(asA).send({ title: "Mine" });

    expect((await request(app).get(`/api/projects/${projectId}/inspirations`).set(asB)).status).toBe(404);
    expect((await request(app).post(`/api/projects/${projectId}/inspirations`).set(asB).send({ title: "X" })).status).toBe(404);
    expect((await request(app).patch(`/api/inspirations/${created.body.id}`).set(asB).send({ title: "X" })).status).toBe(404);
    expect((await request(app).delete(`/api/inspirations/${created.body.id}`).set(asB)).status).toBe(404);
    // Still there for the owner
    expect((await request(app).get(`/api/projects/${projectId}/inspirations`).set(asA)).body).toHaveLength(1);
  });
});
