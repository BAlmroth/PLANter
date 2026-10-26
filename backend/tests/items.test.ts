import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Test files run in parallel and share one database. projects.test.ts cleans up users ...0a and
// ...0b before every test, so these tests use their own two users (...0c and ...0d).
const USER_A = "00000000-0000-4000-8000-00000000000c";
const USER_B = "00000000-0000-4000-8000-00000000000d";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-00000000000c",
    "token-b": "00000000-0000-4000-8000-00000000000d",
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

// Only removes the rows of the two test users. Items go with their projects (cascade).
async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

type Headers = typeof asA;
type ItemBody = { id: string; projectId: string; title: string; type: string; [key: string]: unknown };

// Creates a project through the API and returns its id
async function createProjectAs(headers: Headers) {
  const res = await request(app)
    .post("/api/projects")
    .set(headers)
    .send({ name: "My project", template: "web" });
  return res.body.id as string;
}

// Creates an item through the API and returns it
async function createItemAs(headers: Headers, projectId: string, body: object = {}) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/items`)
    .set(headers)
    .send({ title: "Login page", type: "page", ...body });
  return res.body as ItemBody;
}

describe("POST /api/projects/:projectId/items", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post(`/api/projects/${missingId}/items`)
      .send({ title: "x", type: "page" });
    expect(res.status).toBe(401);
  });

  it("creates an item with the database defaults", async () => {
    const projectId = await createProjectAs(asA);
    const res = await request(app)
      .post(`/api/projects/${projectId}/items`)
      .set(asA)
      .send({ title: "  Login page  ", type: "page" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      projectId,
      title: "Login page",
      type: "page",
      status: "planned",
      isMvp: false,
      positionX: 0,
      positionY: 0,
    });
  });

  it("accepts status, isMvp and description", async () => {
    const projectId = await createProjectAs(asA);
    const res = await request(app)
      .post(`/api/projects/${projectId}/items`)
      .set(asA)
      .send({ title: "Header", type: "component", status: "in_progress", isMvp: true, description: "Top bar" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "in_progress", isMvp: true, description: "Top bar" });
  });

  it("takes the project from the URL and ignores a projectId in the body", async () => {
    const projectA = await createProjectAs(asA);
    const projectB = await createProjectAs(asB);
    const res = await request(app)
      .post(`/api/projects/${projectA}/items`)
      .set(asA)
      .send({ title: "x", type: "page", projectId: projectB });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(projectA);
  });

  it("returns 400 for an unknown item type, with the error on the type field", async () => {
    const projectId = await createProjectAs(asA);
    const res = await request(app)
      .post(`/api/projects/${projectId}/items`)
      .set(asA)
      .send({ title: "x", type: "quest" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.type).toBeDefined();
  });

  it("returns 400 for an empty title, a bad status and a description over 500 characters", async () => {
    const projectId = await createProjectAs(asA);
    const bodies = [
      { title: " ", type: "page" },
      { title: "x", type: "page", status: "finished" },
      { title: "x", type: "page", description: "a".repeat(501) },
    ];
    for (const body of bodies) {
      const res = await request(app).post(`/api/projects/${projectId}/items`).set(asA).send(body);
      expect(res.status).toBe(400);
    }
  });

  it("returns 404 when the project belongs to another user, and creates nothing", async () => {
    const projectId = await createProjectAs(asA);
    const res = await request(app)
      .post(`/api/projects/${projectId}/items`)
      .set(asB)
      .send({ title: "x", type: "page" });
    expect(res.status).toBe(404);
    expect(await prisma.item.count({ where: { projectId } })).toBe(0);
  });

  it("returns 404 for a project that does not exist, and 400 for an id that is not a uuid", async () => {
    const missing = await request(app)
      .post(`/api/projects/${missingId}/items`)
      .set(asA)
      .send({ title: "x", type: "page" });
    expect(missing.status).toBe(404);

    const bad = await request(app)
      .post("/api/projects/not-a-uuid/items")
      .set(asA)
      .send({ title: "x", type: "page" });
    expect(bad.status).toBe(400);
  });
});

describe("GET /api/projects/:projectId/items", () => {
  it("returns only the items of that project, oldest first", async () => {
    const projectId = await createProjectAs(asA);
    const otherProject = await createProjectAs(asA);
    await createItemAs(asA, projectId, { title: "First" });
    await createItemAs(asA, projectId, { title: "Second" });
    await createItemAs(asA, otherProject, { title: "Elsewhere" });

    const res = await request(app).get(`/api/projects/${projectId}/items`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body.map((item: ItemBody) => item.title)).toEqual(["First", "Second"]);
  });

  it("returns an empty list for a project with no items", async () => {
    const projectId = await createProjectAs(asA);
    const res = await request(app).get(`/api/projects/${projectId}/items`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 404 for another user's project", async () => {
    const projectId = await createProjectAs(asA);
    await createItemAs(asA, projectId);
    const res = await request(app).get(`/api/projects/${projectId}/items`).set(asB);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/items/:id", () => {
  it("returns the item to its owner", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).get(`/api/items/${item.id}`).set(asA);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(item.id);
  });

  it("returns 404 for another user's item and for an id that does not exist", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    expect((await request(app).get(`/api/items/${item.id}`).set(asB)).status).toBe(404);
    expect((await request(app).get(`/api/items/${missingId}`).set(asA)).status).toBe(404);
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const res = await request(app).get("/api/items/not-a-uuid").set(asA);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/items/:id", () => {
  it("updates only the fields that were sent", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).patch(`/api/items/${item.id}`).set(asA).send({ status: "done", isMvp: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Login page", type: "page", status: "done", isMvp: true });
  });

  it("can change the type to another type in the template", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).patch(`/api/items/${item.id}`).set(asA).send({ type: "component" });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("component");
  });

  describe("type change and relationships", () => {
    // A component that belongs to a page, plus a function the component triggers
    async function setupConnected() {
      const projectId = await createProjectAs(asA);
      const component = await createItemAs(asA, projectId, { title: "Button", type: "component" });
      const page = await createItemAs(asA, projectId, { title: "Home", type: "page" });
      const fn = await createItemAs(asA, projectId, { title: "save", type: "function" });
      await prisma.relationship.createMany({
        data: [
          { projectId, sourceItemId: component.id, targetItemId: page.id, type: "belongs_to" },
          { projectId, sourceItemId: component.id, targetItemId: fn.id, type: "triggers" },
        ],
      });
      return { projectId, component, page, fn };
    }

    it("returns 409 with a count and changes nothing when a type change would break connections", async () => {
      const { component } = await setupConnected();
      // A page may not belong to a page, so "component belongs to page" breaks. "triggers" stays valid.
      const res = await request(app).patch(`/api/items/${component.id}`).set(asA).send({ type: "data" });
      expect(res.status).toBe(409);
      expect(res.body.error.details).toEqual({ invalidRelationships: 2 });

      const after = await request(app).get(`/api/items/${component.id}`).set(asA);
      expect(after.body.type).toBe("component");
      expect(await prisma.relationship.count({ where: { sourceItemId: component.id } })).toBe(2);
    });

    it("counts only the connections that become invalid, not the ones that stay valid", async () => {
      const { component } = await setupConnected();
      // A page can trigger a function, but "page belongs to page" is not allowed
      const res = await request(app).patch(`/api/items/${component.id}`).set(asA).send({ type: "page" });
      expect(res.status).toBe(409);
      expect(res.body.error.details).toEqual({ invalidRelationships: 1 });
    });

    it("deletes only the invalid connections when the client confirms", async () => {
      const { component, fn } = await setupConnected();
      const res = await request(app)
        .patch(`/api/items/${component.id}`)
        .set(asA)
        .send({ type: "page", confirmRelationshipRemoval: true });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("page");

      const left = await prisma.relationship.findMany({ where: { sourceItemId: component.id } });
      expect(left).toHaveLength(1);
      expect(left[0]).toMatchObject({ targetItemId: fn.id, type: "triggers" });
    });

    it("does not touch connections when only other fields change", async () => {
      const { component } = await setupConnected();
      const res = await request(app).patch(`/api/items/${component.id}`).set(asA).send({ title: "Renamed" });
      expect(res.status).toBe(200);
      expect(await prisma.relationship.count({ where: { sourceItemId: component.id } })).toBe(2);
    });

    it("checks incoming connections too", async () => {
      const { page } = await setupConnected();
      // "component belongs to page" ends at the page, and a component cannot belong to a function
      const res = await request(app).patch(`/api/items/${page.id}`).set(asA).send({ type: "function" });
      expect(res.status).toBe(409);
      expect(res.body.error.details).toEqual({ invalidRelationships: 1 });
    });
  });

  it("returns 400 for an unknown type, and the type stays the same", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).patch(`/api/items/${item.id}`).set(asA).send({ type: "quest" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.type).toBeDefined();

    const after = await request(app).get(`/api/items/${item.id}`).set(asA);
    expect(after.body.type).toBe("page");
  });

  it("returns 404 for another user's item, and the item is not changed", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set(asB)
      .send({ title: "Hacked", type: "component", status: "done" });
    expect(res.status).toBe(404);

    const after = await request(app).get(`/api/items/${item.id}`).set(asA);
    expect(after.body).toMatchObject({ title: "Login page", type: "page", status: "planned" });
  });

  // Without type there is no second ownership check (getOwnedProject), so getOwnedItem alone must stop B
  it("returns 404 when another user changes only the title, and the title stays", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).patch(`/api/items/${item.id}`).set(asB).send({ title: "Hacked" });
    expect(res.status).toBe(404);

    const after = await request(app).get(`/api/items/${item.id}`).set(asA);
    expect(after.body.title).toBe("Login page");
  });

  it("returns 400 for an empty body and for an id that is not a uuid", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    expect((await request(app).patch(`/api/items/${item.id}`).set(asA).send({})).status).toBe(400);
    expect((await request(app).patch("/api/items/not-a-uuid").set(asA).send({ title: "x" })).status).toBe(400);
  });

  it("ignores projectId in the body, so an item cannot be moved to another project", async () => {
    const projectA = await createProjectAs(asA);
    const projectB = await createProjectAs(asB);
    const item = await createItemAs(asA, projectA);
    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set(asA)
      .send({ title: "Moved?", projectId: projectB });
    expect(res.status).toBe(200);
    expect(res.body.projectId).toBe(projectA);
  });
});

describe("DELETE /api/items/:id", () => {
  it("deletes the item for its owner", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).delete(`/api/items/${item.id}`).set(asA);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/items/${item.id}`).set(asA)).status).toBe(404);
  });

  it("returns 404 for another user's item, and the item still exists", async () => {
    const item = await createItemAs(asA, await createProjectAs(asA));
    const res = await request(app).delete(`/api/items/${item.id}`).set(asB);
    expect(res.status).toBe(404);
    expect((await request(app).get(`/api/items/${item.id}`).set(asA)).status).toBe(200);
  });

  it("returns 404 for an id that does not exist", async () => {
    const res = await request(app).delete(`/api/items/${missingId}`).set(asA);
    expect(res.status).toBe(404);
  });
});

describe("deleting a project", () => {
  it("also deletes its items (cascade)", async () => {
    const projectId = await createProjectAs(asA);
    const item = await createItemAs(asA, projectId);
    expect(await prisma.item.count({ where: { projectId } })).toBe(1);

    await request(app).delete(`/api/projects/${projectId}`).set(asA);
    expect(await prisma.item.count({ where: { projectId } })).toBe(0);
    expect(await prisma.item.findUnique({ where: { id: item.id } })).toBeNull();
  });
});
