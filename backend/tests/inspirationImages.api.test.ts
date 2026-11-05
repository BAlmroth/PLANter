import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { deleteImages, uploadImage } from "../src/lib/storage.js";

// Own users (...62 and ...63), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000062";
const USER_B = "00000000-0000-4000-8000-000000000063";

// Fake Supabase login: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000062",
    "token-b": "00000000-0000-4000-8000-000000000063",
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
  const inspiration = await prisma.projectInspiration.create({ data: { projectId: project.id, title: "Mood" } });
  return { projectId: project.id, id: inspiration.id };
}

const putImage = (id: string, body: Buffer, type = "image/png", headers = asA) =>
  request(app).put(`/api/inspirations/${id}/image`).set(headers).set("Content-Type", type).send(body);

describe("inspiration images API", () => {
  it("returns 401 without a token", async () => {
    const { id } = await setup();
    const res = await request(app).put(`/api/inspirations/${id}/image`).set("Content-Type", "image/png").send(png);
    expect(res.status).toBe(401);
  });

  it("uploads an image and returns a signed url, never the storage path", async () => {
    const { projectId, id } = await setup();
    const res = await putImage(id, png);
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(new RegExp(`^https://signed.test/${projectId}/.+\\.png$`));
    expect(res.body).not.toHaveProperty("imagePath");
    expect(uploadImage).toHaveBeenCalledOnce();
  });

  it("includes imageUrl in the list (null when there is no image)", async () => {
    const { projectId, id } = await setup();
    await prisma.projectInspiration.create({ data: { projectId, title: "No image" } });
    await putImage(id, png);
    const list = await request(app).get(`/api/projects/${projectId}/inspirations`).set(asA);
    // Look entries up by title: two rows created in the same millisecond can come back in either order
    const byTitle = (title: string) => list.body.find((i: { title: string }) => i.title === title);
    expect(byTitle("Mood").imageUrl).toMatch(/^https:\/\/signed\.test\//);
    expect(byTitle("No image").imageUrl).toBeNull();
  });

  it("rejects a file whose bytes are not an image, even with an image Content-Type", async () => {
    const { id } = await setup();
    const res = await putImage(id, Buffer.from("<script>alert(1)</script>"));
    expect(res.status).toBe(400);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("rejects a Content-Type that is not an allowed image type", async () => {
    const { id } = await setup();
    const res = await putImage(id, png, "image/svg+xml");
    expect(res.status).toBe(400);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("rejects a file over 5 MB with 413", async () => {
    const { id } = await setup();
    const res = await putImage(id, Buffer.alloc(5 * 1024 * 1024 + 1));
    expect(res.status).toBe(413);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's inspiration and uploads nothing", async () => {
    const { id } = await setup();
    const res = await putImage(id, png, "image/png", asB);
    expect(res.status).toBe(404);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("deletes the old file when the image is replaced", async () => {
    const { id } = await setup();
    await putImage(id, png);
    const oldPath = (await prisma.projectInspiration.findUniqueOrThrow({ where: { id } })).imagePath;
    await putImage(id, png);
    expect(deleteImages).toHaveBeenCalledWith([oldPath]);
  });

  it("deletes the file when the inspiration is deleted", async () => {
    const { id } = await setup();
    await putImage(id, png);
    const path = (await prisma.projectInspiration.findUniqueOrThrow({ where: { id } })).imagePath;
    const res = await request(app).delete(`/api/inspirations/${id}`).set(asA);
    expect(res.status).toBe(204);
    expect(deleteImages).toHaveBeenCalledWith([path]);
  });

  it("deletes the image files of all inspirations when the project is deleted", async () => {
    const { projectId, id } = await setup();
    const second = await prisma.projectInspiration.create({ data: { projectId, title: "Second" } });
    await putImage(id, png);
    await putImage(second.id, png);
    await prisma.projectInspiration.create({ data: { projectId, title: "No image" } });
    const paths = (await prisma.projectInspiration.findMany({ where: { projectId, imagePath: { not: null } } })).map(
      (row) => row.imagePath,
    );

    const res = await request(app).delete(`/api/projects/${projectId}`).set(asA);
    expect(res.status).toBe(204);
    expect(deleteImages).toHaveBeenCalledTimes(1);
    // Both files, in any order, and nothing for the entry without an image
    expect(paths).toHaveLength(2);
    expect(deleteImages).toHaveBeenCalledWith(expect.arrayContaining(paths));
    expect(vi.mocked(deleteImages).mock.calls.flatMap(([called]) => called)).toHaveLength(2);
  });
});
