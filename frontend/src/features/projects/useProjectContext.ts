import { useOutletContext } from "react-router-dom";
import type { useProgress } from "../progress/useProgress";
import type { useWarnings } from "../warnings/useWarnings";
import type { Project } from "./types";

// What ProjectPage gives to every page under /projects/:projectId (through <Outlet context>).
export type ProjectContext = {
  project: Project;
  setProject: (project: Project) => void;
  progress: ReturnType<typeof useProgress>;
  warnings: ReturnType<typeof useWarnings>;
};

export function useProjectContext() {
  return useOutletContext<ProjectContext>();
}
