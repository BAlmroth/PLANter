import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own users (...72 and ...73), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000072";
const USER_B = "00000000-0000-4000-8000-000000000073";

// Fake Supabase login: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000072",
    "token-b": "00000000-0000-4000-8000-000000000073",
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

async function setup() {
  const project = await prisma.project.create({ data: { userId: USER_A, name: "P", template: "web" } });
  return { projectId: project.id };
}

describe("colors API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/colors`);
    expect(res.status).toBe(401);
  });

  it("creates, lists, edits and deletes colors", async () => {
    const { projectId } = await setup();
    const url = `/api/projects/${projectId}/colors`;
    const created = await request(app).post(url).set(asA).send({ hex: "#3e6554", name: "Primary green" });
    expect(created.status).toBe(201);
    // Stored in upper case
    expect(created.body).toMatchObject({ hex: "#3E6554", name: "Primary green" });

    expect((await request(app).get(url).set(asA)).body).toHaveLength(1);

    const edited = await request(app).patch(`/api/colors/${created.body.id}`).set(asA).send({ hex: "#E06D53", name: "" });
    expect(edited.body).toMatchObject({ hex: "#E06D53", name: null });

    expect((await request(app).delete(`/api/colors/${created.body.id}`).set(asA)).status).toBe(204);
    expect((await request(app).get(url).set(asA)).body).toEqual([]);
  });

  it("allows a color without a name", async () => {
    const { projectId } = await setup();
    const res = await request(app).post(`/api/projects/${projectId}/colors`).set(asA).send({ hex: "#1C2826" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBeNull();
  });

  it("rejects anything that is not #RRGGBB, and an empty edit", async () => {
    const { projectId } = await setup();
    const url = `/api/projects/${projectId}/colors`;
    for (const hex of ["red", "3E6554", "#3E655", "#3E65544", "#GGGGGG", "url(x)", "#3E6554; color: red"]) {
      expect((await request(app).post(url).set(asA).send({ hex })).status).toBe(400);
    }
    const created = await request(app).post(url).set(asA).send({ hex: "#3E6554" });
    expect((await request(app).patch(`/api/colors/${created.body.id}`).set(asA).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/colors/${created.body.id}`).set(asA).send({ hex: "red" })).status).toBe(400);
  });

  it("returns 404 for another user's project and colors, and changes nothing", async () => {
    const { projectId } = await setup();
    const url = `/api/projects/${projectId}/colors`;
    const created = await request(app).post(url).set(asA).send({ hex: "#3E6554" });

    expect((await request(app).get(url).set(asB)).status).toBe(404);
    expect((await request(app).post(url).set(asB).send({ hex: "#000000" })).status).toBe(404);
    expect((await request(app).patch(`/api/colors/${created.body.id}`).set(asB).send({ hex: "#000000" })).status).toBe(404);
    expect((await request(app).delete(`/api/colors/${created.body.id}`).set(asB)).status).toBe(404);
    expect(await prisma.projectColor.findMany({ where: { projectId } })).toMatchObject([{ hex: "#3E6554" }]);
  });

  it("deletes the palette with the project", async () => {
    const { projectId } = await setup();
    await request(app).post(`/api/projects/${projectId}/colors`).set(asA).send({ hex: "#3E6554" });
    await request(app).delete(`/api/projects/${projectId}`).set(asA);
    expect(await prisma.projectColor.count({ where: { projectId } })).toBe(0);
  });
});
