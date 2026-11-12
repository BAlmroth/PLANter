import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { deleteImages, uploadImage } from "../src/lib/storage.js";

// Own users (...64 and ...65), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000064";
const USER_B = "00000000-0000-4000-8000-000000000065";

// Fake Supabase login: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000064",
    "token-b": "00000000-0000-4000-8000-000000000065",
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

// Fake Storage: no real uploads. vi.fn() records the calls so the tests can check them.
vi.mock("../src/lib/storage.js", () => ({
  uploadImage: vi.fn(async () => {}),
  deleteImages: vi.fn(async () => {}),
  getSignedUrls: vi.fn(async (paths: string[]) => new Map(paths.map((p) => [p, `https://signed.test/${p}`]))),
}));

const asA = { Authorization: "Bearer token-a" };
const asB = { Authorization: "Bearer token-b" };

// The first bytes of a real PNG, then some filler. Enough for the magic bytes check.
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);

async function cleanUp() {
  await prisma.project.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
}
beforeEach(async () => {
  vi.clearAllMocks();
  await cleanUp();
});
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

async function setup() {
  const project = await prisma.project.create({ data: { userId: USER_A, name: "P", template: "web" } });
  const item = await prisma.item.create({ data: { projectId: project.id, type: "page", title: "Login" } });
  return { projectId: project.id, id: item.id };
}

const putImage = (id: string, body: Buffer, type = "image/png", headers = asA) =>
  request(app).put(`/api/items/${id}/image`).set(headers).set("Content-Type", type).send(body);

const storedPath = async (id: string) => (await prisma.item.findUniqueOrThrow({ where: { id } })).imagePath;

describe("item main photo API", () => {
  it("returns 401 without a token", async () => {
    const { id } = await setup();
    const res = await request(app).put(`/api/items/${id}/image`).set("Content-Type", "image/png").send(png);
    expect(res.status).toBe(401);
  });

  it("uploads a photo and returns a signed url, never the storage path", async () => {
    const { projectId, id } = await setup();
    const res = await putImage(id, png);
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(new RegExp(`^https://signed.test/${projectId}/.+\\.png$`));
    expect(res.body).not.toHaveProperty("imagePath");
    expect(uploadImage).toHaveBeenCalledOnce();
  });

  it("includes imageUrl when getting one item and listing items (null without a photo)", async () => {
    const { projectId, id } = await setup();
    const other = await prisma.item.create({ data: { projectId, type: "page", title: "Plain" } });
    await putImage(id, png);

    const one = await request(app).get(`/api/items/${id}`).set(asA);
    expect(one.body.imageUrl).toMatch(/^https:\/\/signed\.test\//);
    expect(one.body).not.toHaveProperty("imagePath");

    const list = await request(app).get(`/api/projects/${projectId}/items`).set(asA);
    const byId = (itemId: string) => list.body.find((i: { id: string }) => i.id === itemId);
    expect(byId(id).imageUrl).toMatch(/^https:\/\/signed\.test\//);
    expect(byId(other.id).imageUrl).toBeNull();
  });

  it("rejects a file whose bytes are not an image, a wrong Content-Type and a file over 5 MB", async () => {
    const { id } = await setup();
    expect((await putImage(id, Buffer.from("<script>alert(1)</script>"))).status).toBe(400);
    expect((await putImage(id, png, "image/svg+xml")).status).toBe(400);
    expect((await putImage(id, Buffer.alloc(5 * 1024 * 1024 + 1))).status).toBe(413);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's item and uploads nothing", async () => {
    const { id } = await setup();
    const res = await putImage(id, png, "image/png", asB);
    expect(res.status).toBe(404);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("deletes the old file when the photo is replaced", async () => {
    const { id } = await setup();
    await putImage(id, png);
    const oldPath = await storedPath(id);
    await putImage(id, png);
    expect(deleteImages).toHaveBeenCalledWith([oldPath]);
  });

  it("deletes the photo file when the item is deleted", async () => {
    const { id } = await setup();
    await putImage(id, png);
    const path = await storedPath(id);
    const res = await request(app).delete(`/api/items/${id}`).set(asA);
    expect(res.status).toBe(204);
    expect(deleteImages).toHaveBeenCalledWith([path]);
  });

  it("deletes the photo files of all items when the project is deleted", async () => {
    const { projectId, id } = await setup();
    const second = await prisma.item.create({ data: { projectId, type: "page", title: "Second" } });
    await putImage(id, png);
    await putImage(second.id, png);
    const paths = [await storedPath(id), await storedPath(second.id)];
    vi.clearAllMocks();

    const res = await request(app).delete(`/api/projects/${projectId}`).set(asA);
    expect(res.status).toBe(204);
    expect(deleteImages).toHaveBeenCalledWith(expect.arrayContaining(paths));
    expect(vi.mocked(deleteImages).mock.calls.flatMap(([called]) => called)).toHaveLength(2);
  });
});
