import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { webTemplate } from "../src/templates/web.js";

// Same fake Supabase as in middleware.test.ts: only "token-a" is a valid token
vi.mock("../src/lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: async (token: string) =>
        token === "token-a"
          ? { data: { user: { id: "user-a" } }, error: null }
          : { data: { user: null }, error: new Error("invalid token") },
    },
  },
}));

describe("GET /api/templates/:key", () => {
  it("returns 200 and the template with a valid token", async () => {
    const res = await request(app)
      .get("/api/templates/web")
      .set("Authorization", "Bearer token-a");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(webTemplate);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/templates/web");
    expect(res.status).toBe(401);
  });

  it("returns 404 in the normal error shape for an unknown key", async () => {
    const res = await request(app)
      .get("/api/templates/nope")
      .set("Authorization", "Bearer token-a");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Template not found" } });
  });

  it("returns 404 for a key that exists on Object.prototype", async () => {
    const res = await request(app)
      .get("/api/templates/constructor")
      .set("Authorization", "Bearer token-a");
    expect(res.status).toBe(404);
  });
});
