import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// user_id is a uuid column, so the fake users need real uuids
const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-00000000000a",
    "token-b": "00000000-0000-4000-8000-00000000000b",
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

// Only removes the rows of the two test users
async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

// Creates a project through the API and returns it
async function createAs(headers: typeof asA, body: object = { name: "My project", template: "web" }) {
  const res = await request(app).post("/api/projects").set(headers).send(body);
  return res.body as { id: string; name: string; userId: string };
}

describe("POST /api/projects", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/projects").send({ name: "x", template: "web" });
    expect(res.status).toBe(401);
  });

  it("creates a project owned by the logged-in user", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set(asA)
      .send({ name: "  My project  ", description: "", template: "web" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My project");
    expect(res.body.description).toBe("");
    expect(res.body.userId).toBe(USER_A);
  });

  it("ignores a userId sent in the body", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set(asB)
      .send({ name: "x", template: "web", userId: USER_A });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(USER_B);
  });

  it("returns 400 for an empty name", async () => {
    const res = await request(app).post("/api/projects").set(asA).send({ name: " ", template: "web" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.name).toBeDefined();
  });

  it("returns 400 for an unknown template", async () => {
    const res = await request(app).post("/api/projects").set(asA).send({ name: "x", template: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.template).toBeDefined();
  });

  it("returns 400 for a description over 500 characters", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set(asA)
      .send({ name: "x", template: "web", description: "a".repeat(501) });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/projects", () => {
  it("lists only the logged-in user's projects", async () => {
    await createAs(asA, { name: "A's project", template: "web" });
    await createAs(asB, { name: "B's project", template: "web" });

    const res = await request(app).get("/api/projects").set(asA);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("A's project");
  });
});

describe("GET /api/projects/:id", () => {
  it("returns the project to its owner", async () => {
    const project = await createAs(asA);
    const res = await request(app).get(`/api/projects/${project.id}`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
  });

  it("returns 404 to another user", async () => {
    const project = await createAs(asA);
    const res = await request(app).get(`/api/projects/${project.id}`).set(asB);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a project that does not exist", async () => {
    const res = await request(app).get(`/api/projects/${missingId}`).set(asA);
    expect(res.status).toBe(404);
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const res = await request(app).get("/api/projects/not-a-uuid").set(asA);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/projects/:id", () => {
  it("updates name and description for the owner", async () => {
    const project = await createAs(asA);
    const res = await request(app)
      .patch(`/api/projects/${project.id}`)
      .set(asA)
      .send({ name: "New name", description: "New text" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New name");
    expect(res.body.description).toBe("New text");
  });

  it("only changes the fields that were sent", async () => {
    const project = await createAs(asA, { name: "Keep me", description: "Old", template: "web" });
    const res = await request(app)
      .patch(`/api/projects/${project.id}`)
      .set(asA)
      .send({ description: "New" });
    expect(res.body.name).toBe("Keep me");
    expect(res.body.description).toBe("New");
  });

  it("returns 404 to another user and leaves the project unchanged", async () => {
    const project = await createAs(asA);
    const res = await request(app)
      .patch(`/api/projects/${project.id}`)
      .set(asB)
      .send({ name: "Hijacked" });
    expect(res.status).toBe(404);

    const after = await request(app).get(`/api/projects/${project.id}`).set(asA);
    expect(after.body.name).toBe("My project");
  });

  it("returns 400 for an empty body", async () => {
    const project = await createAs(asA);
    const res = await request(app).patch(`/api/projects/${project.id}`).set(asA).send({});
    expect(res.status).toBe(400);
  });

  it("does not change template or userId", async () => {
    const project = await createAs(asA);
    const res = await request(app)
      .patch(`/api/projects/${project.id}`)
      .set(asA)
      .send({ name: "Renamed", template: "game", userId: USER_B });
    expect(res.status).toBe(200);
    expect(res.body.template).toBe("web");
    expect(res.body.userId).toBe(USER_A);
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const res = await request(app).patch("/api/projects/not-a-uuid").set(asA).send({ name: "x" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/projects/:id", () => {
  it("returns 404 to another user and keeps the project", async () => {
    const project = await createAs(asA);
    const res = await request(app).delete(`/api/projects/${project.id}`).set(asB);
    expect(res.status).toBe(404);

    const after = await request(app).get(`/api/projects/${project.id}`).set(asA);
    expect(after.status).toBe(200);
  });

  it("deletes the project for the owner", async () => {
    const project = await createAs(asA);
    const res = await request(app).delete(`/api/projects/${project.id}`).set(asA);
    expect(res.status).toBe(204);

    const after = await request(app).get(`/api/projects/${project.id}`).set(asA);
    expect(after.status).toBe(404);
  });

  it("returns 404 when deleting a project that does not exist", async () => {
    const res = await request(app).delete(`/api/projects/${missingId}`).set(asA);
    expect(res.status).toBe(404);
  });
});
