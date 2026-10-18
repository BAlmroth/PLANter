import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { testRouter } from "./routes/testRoute.js";

export const app = express();

// Only allow browser requests from frontend
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Health check: confirms the server is up and responding
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// TEMPORARY test route, delete when real routes exist
app.use("/api/_test", testRouter);

// Must be last: unknown routes get a 404, and every error gets the same response shape
app.use(notFoundHandler);
app.use(errorHandler);
