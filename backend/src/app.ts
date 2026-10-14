import express from "express";
import cors from "cors";
import { env } from "./config/env.js";

export const app = express();

// Only allow browser requests from frontend
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Health check: confirms the server is up and responding, checks so all env are correct
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
