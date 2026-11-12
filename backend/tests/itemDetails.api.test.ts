import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { deleteImages, uploadImage } from "../src/lib/storage.js";

// Own users (...66 and ...67), because test files run in parallel and share one database
const USER_A = "00000000-0000-4000-8000-000000000066";
const USER_B = "00000000-0000-4000-8000-000000000067";

// Fake Supabase login: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000066",
    "token-b": "00000000-0000-4000-8000-000000000067",
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

// Fake Storage: no real uploads
vi.mock("../src/lib/storage.js", () => ({
  uploadImage: vi.fn(async () => {}),
  deleteImages: vi.fn(async () => {}),
  getSignedUrls: vi.fn(async (paths: string[]) => new Map(paths.map((p) => [p, `https://signed.test/${p}`]))),
}));

const asA = { Authorization: "Bearer token-a" };
const asB = { Authorization: "Bearer token-b" };
const missingId = "11111111-1111-4111-8111-111111111111";
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
  return { projectId: project.id, itemId: item.id };
}

const putImage = (id: string, body: Buffer, type = "image/png", headers = asA) =>
  request(app).put(`/api/item-details/${id}/image`).set(headers).set("Content-Type", type).send(body);

async function createDetail(itemId: string, body: object = { title: "Mood" }) {
  const res = await request(app).post(`/api/items/${itemId}/details`).set(asA).send(body);
  return res.body.id as string;
}
const storedPath = async (id: string) => (await prisma.itemDetail.findUniqueOrThrow({ where: { id } })).imagePath;

describe("item details API", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/items/${missingId}/details`);
    expect(res.status).toBe(401);
  });

  it("creates, lists, edits and deletes details", async () => {
    const { itemId } = await setup();
    const created = await request(app)
      .post(`/api/items/${itemId}/details`)
      .set(asA)
      .send({ title: "Nice login", url: "https://example.com", text: "Clean typography" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "Nice login", url: "https://example.com", imageUrl: null });

    const list = await request(app).get(`/api/items/${itemId}/details`).set(asA);
    expect(list.body).toHaveLength(1);

    const edited = await request(app).patch(`/api/item-details/${created.body.id}`).set(asA).send({ url: "", text: "New" });
    expect(edited.body).toMatchObject({ url: null, text: "New" });

    const deleted = await request(app).delete(`/api/item-details/${created.body.id}`).set(asA);
    expect(deleted.status).toBe(204);
    expect((await request(app).get(`/api/items/${itemId}/details`).set(asA)).body).toEqual([]);
  });

  it("validates input: empty title, javascript: link, empty edit", async () => {
    const { itemId } = await setup();
    const url = `/api/items/${itemId}/details`;
    expect((await request(app).post(url).set(asA).send({ title: "" })).status).toBe(400);
    expect((await request(app).post(url).set(asA).send({ title: "x", url: "javascript:alert(1)" })).status).toBe(400);
    const id = await createDetail(itemId);
    expect((await request(app).patch(`/api/item-details/${id}`).set(asA).send({})).status).toBe(400);
  });

  it("returns 404 for another user's item and details, and changes nothing", async () => {
    const { itemId } = await setup();
    const id = await createDetail(itemId);

    expect((await request(app).get(`/api/items/${itemId}/details`).set(asB)).status).toBe(404);
    expect((await request(app).post(`/api/items/${itemId}/details`).set(asB).send({ title: "x" })).status).toBe(404);
    expect((await request(app).patch(`/api/item-details/${id}`).set(asB).send({ title: "x" })).status).toBe(404);
    expect((await request(app).delete(`/api/item-details/${id}`).set(asB)).status).toBe(404);
    expect((await putImage(id, png, "image/png", asB)).status).toBe(404);
    expect(uploadImage).not.toHaveBeenCalled();
    expect(await prisma.itemDetail.count({ where: { itemId } })).toBe(1);
  });

  it("uploads an image and returns a signed url, never the storage path", async () => {
    const { projectId, itemId } = await setup();
    const id = await createDetail(itemId);
    const res = await putImage(id, png);
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(new RegExp(`^https://signed.test/${projectId}/.+\\.png$`));
    expect(res.body).not.toHaveProperty("imagePath");

    const list = await request(app).get(`/api/items/${itemId}/details`).set(asA);
    expect(list.body[0].imageUrl).toMatch(/^https:\/\/signed\.test\//);
  });

  it("rejects a file that is not an image, a wrong Content-Type and a file over 5 MB", async () => {
    const { itemId } = await setup();
    const id = await createDetail(itemId);
    expect((await putImage(id, Buffer.from("<script>alert(1)</script>"))).status).toBe(400);
    expect((await putImage(id, png, "image/svg+xml")).status).toBe(400);
    expect((await putImage(id, Buffer.alloc(5 * 1024 * 1024 + 1))).status).toBe(413);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("deletes the old file when replaced, and the file when the detail is deleted", async () => {
    const { itemId } = await setup();
    const id = await createDetail(itemId);
    await putImage(id, png);
    const first = await storedPath(id);
    await putImage(id, png);
    expect(deleteImages).toHaveBeenCalledWith([first]);

    const last = await storedPath(id);
    await request(app).delete(`/api/item-details/${id}`).set(asA);
    expect(deleteImages).toHaveBeenLastCalledWith([last]);
  });

  it("deletes the image files of an item's details when the item is deleted", async () => {
    const { itemId } = await setup();
    const one = await createDetail(itemId);
    const two = await createDetail(itemId, { title: "Two" });
    await putImage(one, png);
    await putImage(two, png);
    const paths = [await storedPath(one), await storedPath(two)];
    vi.clearAllMocks();

    expect((await request(app).delete(`/api/items/${itemId}`).set(asA)).status).toBe(204);
    expect(deleteImages).toHaveBeenCalledWith(expect.arrayContaining(paths));
    expect(vi.mocked(deleteImages).mock.calls.flatMap(([called]) => called)).toHaveLength(2);
  });

  it("deletes the image files of details when the project is deleted", async () => {
    const { projectId, itemId } = await setup();
    const id = await createDetail(itemId);
    await putImage(id, png);
    const path = await storedPath(id);
    vi.clearAllMocks();

    expect((await request(app).delete(`/api/projects/${projectId}`).set(asA)).status).toBe(204);
    expect(deleteImages).toHaveBeenCalledWith([path]);
  });
});
