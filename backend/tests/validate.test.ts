import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "../src/middleware/validate.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

// A tiny app with one route, so validate can be tested on its own
const testApp = express();
testApp.get("/:id", validate(z.object({ id: z.uuid() }), "params"), (req, res) => {
  res.json({ id: req.params.id });
});
testApp.use(errorHandler);

describe("validate with source 'params'", () => {
  it("returns 400 with details for an invalid param", async () => {
    const res = await request(testApp).get("/not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Invalid request params");
    expect(res.body.error.details.fieldErrors.id).toBeDefined();
  });

  it("continues for a valid param", async () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const res = await request(testApp).get(`/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id });
  });
});
