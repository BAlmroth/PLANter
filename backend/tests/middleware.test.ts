import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

// Replace the real Supabase client with a fake, so tests never make a real call.
// "token-a" and "token-b" belong to two different users, every other token is invalid.
vi.mock("../src/lib/supabase.js", () => {
  const users: Record<string, string> = { "token-a": "user-a", "token-b": "user-b" };
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

// POST /api/relationships is used as an example of a protected route with a validated body.
// All of these requests stop before the database is reached.
describe("requireAuth + validate (POST /api/relationships)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/relationships").send({});
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBeTypeOf("string");
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .post("/api/relationships")
      .set("Authorization", "Bearer wrong-token")
      .send({});
    expect(res.status).toBe(401);
  });

  it("returns 400 with details for an invalid body", async () => {
    const res = await request(app)
      .post("/api/relationships")
      .set("Authorization", "Bearer token-a")
      .send({ sourceItemId: "not-a-uuid", targetItemId: "x", type: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBeTypeOf("string");
    expect(res.body.error.details.fieldErrors.sourceItemId).toBeDefined();
  });
});

describe("error handler", () => {
  it("returns 404 in the error shape for an unknown route", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Route not found" } });
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await request(app)
      .post("/api/relationships")
      .set("Authorization", "Bearer token-a")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
  });
});
