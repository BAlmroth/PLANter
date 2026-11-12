import { useOutletContext } from "react-router-dom";
import type { useProgress } from "../progress/useProgress";
import type { useWarnings } from "../warnings/useWarnings";
import type { Project } from "./types";

// What the sub header needs to show the trail of an item page (the item is loaded by the page itself)
export type ItemCrumb = { title: string; typeLabel: string };

// What ProjectPage gives to every page under /projects/:projectId (through <Outlet context>).
export type ProjectContext = {
  project: Project;
  setProject: (project: Project) => void;
  progress: ReturnType<typeof useProgress>;
  warnings: ReturnType<typeof useWarnings>;
  // The item page tells the sub header which item is open (null when it is closed)
  setItemCrumb: (crumb: ItemCrumb | null) => void;
};

export function useProjectContext() {
  return useOutletContext<ProjectContext>();
}
