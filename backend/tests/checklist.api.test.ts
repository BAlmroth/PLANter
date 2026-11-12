import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Own pair of users, so this file does not delete rows that other test files use in parallel
const USER_A = "00000000-0000-4000-8000-000000000080";
const USER_B = "00000000-0000-4000-8000-000000000081";

// Fake Supabase: "token-a" and "token-b" belong to two different users
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = {
    "token-a": "00000000-0000-4000-8000-000000000080",
    "token-b": "00000000-0000-4000-8000-000000000081",
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

// Only removes the rows of the two test users (items, tasks and sprints go with their project)
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

async function getChecklist(projectId: string, headers: typeof asA) {
  return request(app).get(`/api/projects/${projectId}/checklist`).set(headers);
}

// The keys of the checks that passed, so a test can compare one simple list
function passedKeys(body: { key: string; passed: boolean }[]) {
  return body.filter((c) => c.passed).map((c) => c.key);
}

describe("GET /api/projects/:id/checklist", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${missingId}/checklist`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for a project id that is not a uuid", async () => {
    const res = await request(app).get("/api/projects/not-a-uuid/checklist").set(asA);
    expect(res.status).toBe(400);
  });

  it("returns 404 for a project that does not exist", async () => {
    const res = await getChecklist(missingId, asA);
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's project and shows nothing about it", async () => {
    const projectId = await createProjectAs(asA);
    await createItemAs(asA, projectId, "testing");

    const res = await getChecklist(projectId, asB);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Project not found" } });
  });

  it("returns every check, all failed, for an empty project", async () => {
    const projectId = await createProjectAs(asA);

    const res = await getChecklist(projectId, asA);
    expect(res.status).toBe(200);
    expect(res.body).toContainEqual({ key: "has_testing", kind: "category", label: "Plan the tests", passed: false });
    expect(res.body).toContainEqual({ key: "has_sprint", kind: "readiness", label: "Create a sprint", passed: false });
    expect(passedKeys(res.body)).toEqual([]);
  });

  it("passes the checks as the project is planned", async () => {
    const projectId = await createProjectAs(asA);
    const testId = await createItemAs(asA, projectId, "testing", { isMvp: true });
    await createItemAs(asA, projectId, "authentication");
    await request(app).post(`/api/projects/${projectId}/sprints`).set(asA).send({ name: "Sprint 1" });

    const before = await getChecklist(projectId, asA);
    // The MVP test item has no task yet, so mvp_has_tasks still fails
    expect(passedKeys(before.body)).toEqual(["has_authentication", "has_testing", "has_mvp", "has_sprint", "connections"]);

    await request(app).post(`/api/projects/${projectId}/tasks`).set(asA).send({ title: "Write tests", itemId: testId });

    const after = await getChecklist(projectId, asA);
    expect(passedKeys(after.body)).toContain("mvp_has_tasks");
  });

  it("only looks at the project in the URL, not the user's other projects", async () => {
    const projectId = await createProjectAs(asA);
    const otherId = await createProjectAs(asA);
    await createItemAs(asA, otherId, "design");
    await request(app).post(`/api/projects/${otherId}/sprints`).set(asA).send({ name: "Sprint 1" });

    const res = await getChecklist(projectId, asA);
    expect(passedKeys(res.body)).toEqual([]);
  });
});
