import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { templatesRouter } from "./routes/templates.js";
import { projectsRouter } from "./routes/projects.js";
import { itemsRouter, projectItemsRouter } from "./routes/items.js";
import { projectRelationshipsRouter, relationshipsRouter } from "./routes/relationships.js";
import { projectTasksRouter, tasksRouter } from "./routes/tasks.js";
import { projectSprintsRouter, sprintsRouter } from "./routes/sprints.js";
import { groupsRouter, projectGroupsRouter } from "./routes/groups.js";
import { itemDetailsOfItemRouter, itemDetailsRouter } from "./routes/itemDetails.js";
import { itemColorsRouter, projectItemColorsRouter } from "./routes/itemColors.js";
import { colorsRouter, projectColorsRouter } from "./routes/colors.js";
import { inspirationsRouter, projectInspirationsRouter } from "./routes/inspirations.js";

export const app = express();

// Only allow browser requests from frontend
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Health check: confirms the server is up and responding
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/templates", templatesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/items", projectItemsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/items/:itemId/details", itemDetailsOfItemRouter);
app.use("/api/item-details", itemDetailsRouter);
app.use("/api/projects/:projectId/relationships", projectRelationshipsRouter);
app.use("/api/relationships", relationshipsRouter);
app.use("/api/projects/:projectId/tasks", projectTasksRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/projects/:projectId/sprints", projectSprintsRouter);
app.use("/api/sprints", sprintsRouter);
app.use("/api/projects/:projectId/groups", projectGroupsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/projects/:projectId/inspirations", projectInspirationsRouter);
app.use("/api/inspirations", inspirationsRouter);
app.use("/api/projects/:projectId/colors", projectColorsRouter);
app.use("/api/colors", colorsRouter);
app.use("/api/projects/:projectId/item-colors", projectItemColorsRouter);
app.use("/api/items/:itemId/colors", itemColorsRouter);

// Must be last: unknown routes get a 404, and every error gets the same response shape
app.use(notFoundHandler);
app.use(errorHandler);
