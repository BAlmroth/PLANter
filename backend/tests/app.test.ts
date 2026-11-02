import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
// Supertest sends fake HTTP requests to app, checks so health endpoint works as intended

// Group all tests for the /health endpoint
describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
