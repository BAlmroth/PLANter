import { readdirSync } from "node:fs";
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { gameDemo } from "../src/seed/demoGame.js";
import { DEMOS, readSeedImage, SEED_IMAGE_DIR, seedDemoProject, type SeedStorage } from "../src/seed/seedDemo.js";
import type { DemoData } from "../src/seed/types.js";
import { detectImageKind } from "../src/services/imageFiles.js";

// Images, colors and inspiration in the demo projects. Own user (...52), because test files share one database.
const USER = "00000000-0000-4000-8000-000000000052";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // the same limit as the upload routes

// Every image a demo uses: main photos, item details and inspiration
function imagesOf(demo: DemoData) {
  return [
    ...demo.items.flatMap((i) => (i.image ? [i.image] : [])),
    ...demo.items.flatMap((i) => (i.details ?? []).flatMap((d) => (d.image ? [d.image] : []))),
    ...demo.inspirations.flatMap((i) => (i.image ? [i.image] : [])),
  ];
}

describe.each(Object.entries(DEMOS))("%s demo: images, palette and inspiration", (_name, demo) => {
  const refs = new Set(demo.items.map((i) => i.ref));

  it("only uses image files that exist and are real images under 5 MB", async () => {
    expect(imagesOf(demo).length).toBeGreaterThan(0);
    for (const name of imagesOf(demo)) {
      const file = await readSeedImage(name);
      expect(detectImageKind(file), name).not.toBeNull();
      expect(file.length, name).toBeLessThan(MAX_IMAGE_BYTES);
    }
  });

  it("has a palette of unique #RRGGBB colors, linked to existing items", () => {
    expect(demo.colors.length).toBeGreaterThan(0);
    for (const color of demo.colors) {
      expect(color.hex, color.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect((color.name ?? "").length).toBeLessThanOrEqual(100);
      for (const ref of color.items ?? []) expect(refs.has(ref), ref).toBe(true);
      expect(new Set(color.items).size, color.hex).toBe((color.items ?? []).length);
    }
    expect(new Set(demo.colors.map((c) => c.hex)).size).toBe(demo.colors.length);
  });

  it("has inspiration within the Zod limits, with only http(s) links", () => {
    for (const i of demo.inspirations) {
      expect(i.title.length).toBeLessThanOrEqual(100);
      expect((i.text ?? "").length).toBeLessThanOrEqual(2000);
      if (i.url) expect(i.url).toMatch(/^https?:\/\//);
    }
    for (const d of demo.items.flatMap((i) => i.details ?? [])) {
      expect(d.title.length).toBeLessThanOrEqual(100);
      expect((d.text ?? "").length).toBeLessThanOrEqual(2000);
    }
  });
});

describe("demo images folder", () => {
  it("has no unused files (each file is used by at least one demo)", () => {
    const used = new Set(Object.values(DEMOS).flatMap(imagesOf));
    const files = readdirSync(SEED_IMAGE_DIR).filter((f) => !f.startsWith("."));
    expect(files.sort()).toEqual([...used].sort());
  });

  it("gives the game demo moodboard and inspiration entries", () => {
    const sections = gameDemo.inspirations.map((i) => i.section ?? (i.url ? "inspiration" : "moodboard"));
    expect(sections).toContain("moodboard");
    expect(sections).toContain("inspiration");
  });
});

describe("seedDemoProject with images (database, fake storage)", () => {
  // Remembers what would have been uploaded and deleted, instead of talking to Supabase
  function fakeStorage() {
    const saved: string[] = [];
    const deleted: (string | null)[] = [];
    const storage: SeedStorage = {
      saveImage: async (projectId, file) => {
        expect(detectImageKind(file)).not.toBeNull();
        const path = `${projectId}/fake-${saved.length}.png`;
        saved.push(path);
        return path;
      },
      deleteImages: async (rows) => {
        deleted.push(...rows.map((r) => r.imagePath));
      },
    };
    return { storage, saved, deleted };
  }

  beforeEach(() => prisma.project.deleteMany({ where: { userId: USER } }));
  afterAll(async () => {
    await prisma.project.deleteMany({ where: { userId: USER } });
    await prisma.$disconnect();
  });

  it("uploads every image once per use and saves the paths, the palette and the color links", async () => {
    const { storage, saved } = fakeStorage();
    const result = await seedDemoProject(USER, gameDemo, storage);
    expect(saved).toHaveLength(imagesOf(gameDemo).length);
    expect(result.images).toBe(saved.length);
    for (const path of saved) expect(path.startsWith(`${result.projectId}/`)).toBe(true);

    const tea = await prisma.item.findFirstOrThrow({ where: { projectId: result.projectId, title: "Emerald tea" } });
    expect(saved).toContain(tea.imagePath);
    const withImage = await prisma.projectInspiration.count({ where: { projectId: result.projectId, imagePath: { not: null } } });
    expect(withImage).toBe(gameDemo.inspirations.filter((i) => i.image).length);
    // Every item reference with an image got its own uploaded file
    const detailImages = await prisma.itemDetail.findMany({
      where: { item: { projectId: result.projectId }, imagePath: { not: null } },
      select: { imagePath: true },
    });
    expect(detailImages).toHaveLength(gameDemo.items.flatMap((i) => (i.details ?? []).filter((d) => d.image)).length);
    for (const d of detailImages) expect(saved).toContain(d.imagePath);

    expect(await prisma.projectColor.count({ where: { projectId: result.projectId } })).toBe(gameDemo.colors.length);
    expect(await prisma.itemColor.count({ where: { projectId: result.projectId } })).toBe(
      gameDemo.colors.reduce((n, c) => n + (c.items ?? []).length, 0),
    );
  });

  it("deletes the old copy's files when the demo is seeded again", async () => {
    const first = fakeStorage();
    await seedDemoProject(USER, gameDemo, first.storage);
    const second = fakeStorage();
    await seedDemoProject(USER, gameDemo, second.storage);
    expect(second.deleted.sort()).toEqual([...first.saved].sort());
  });

  it("removes the files it uploaded when the seed fails, and saves nothing", async () => {
    const broken: DemoData = {
      ...gameDemo,
      project: { ...gameDemo.project, name: "Broken demo" },
      groups: [{ name: "Points at nothing", items: ["no-such-item"] }],
    };
    const { storage, saved, deleted } = fakeStorage();
    await expect(seedDemoProject(USER, broken, storage)).rejects.toThrow("unknown item");
    expect(saved.length).toBeGreaterThan(0);
    expect(deleted.sort()).toEqual([...saved].sort());
    expect(await prisma.project.count({ where: { userId: USER, name: "Broken demo" } })).toBe(0);
  });

  it("uploads nothing without storage (tests and local databases)", async () => {
    const result = await seedDemoProject(USER, gameDemo);
    expect(result.images).toBe(0);
    expect(await prisma.item.count({ where: { projectId: result.projectId, imagePath: { not: null } } })).toBe(0);
  });
});
