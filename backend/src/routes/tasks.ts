import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "../schemas/tasks.js";
import { createTask, deleteTask, listTasks, updateTask } from "../services/tasks.js";

// Tasks are listed and created inside a project: /api/projects/:projectId/tasks
export const projectTasksRouter = Router({ mergeParams: true });
projectTasksRouter.use(requireAuth);

projectTasksRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listTasks(projectId, req.userId!));
});

projectTasksRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createTaskSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    res.status(201).json(await createTask(projectId, req.userId!, req.body));
  },
);

// One task is identified by its id alone: /api/tasks/:id
export const tasksRouter = Router();
tasksRouter.use(requireAuth);

// Update title, done and/or the linked item
tasksRouter.patch(
  "/:id",
  validate(taskIdSchema, "params"),
  validate(updateTaskSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof taskIdSchema>;
    res.json(await updateTask(id, req.userId!, req.body));
  },
);

tasksRouter.delete("/:id", validate(taskIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof taskIdSchema>;
  await deleteTask(id, req.userId!);
  res.status(204).end();
});
