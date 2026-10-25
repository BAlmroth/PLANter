import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { testRouter } from "./routes/testRoute.js";
import { templatesRouter } from "./routes/templates.js";
import { projectsRouter } from "./routes/projects.js";
import { itemsRouter, projectItemsRouter } from "./routes/items.js";

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

app.use("/api/templates", templatesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/items", projectItemsRouter);
app.use("/api/items", itemsRouter);

// Must be last: unknown routes get a 404, and every error gets the same response shape
app.use(notFoundHandler);
app.use(errorHandler);
