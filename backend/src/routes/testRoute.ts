import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";

// TEMPORARY: only here to test requireAuth and validate together. Delete when real routes exist.
export const testRouter = Router();

const bodySchema = z.object({ name: z.string().min(1).max(100) });

testRouter.post("/", requireAuth, validate(bodySchema), (req, res) => {
  res.json({ userId: req.userId, name: req.body.name });
});
