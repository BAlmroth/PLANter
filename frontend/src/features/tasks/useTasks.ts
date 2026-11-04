import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listTasks } from "./tasksApi";
import type { Task } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; tasks: Task[]; error: string | null };

// Fetches a project's tasks and keeps track of loading and error state.
export function useTasks(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    listTasks(projectId)
      .then((tasks) => {
        if (!cancelled) setResult({ projectId, tasks, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, tasks: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  const loading = result === null || result.projectId !== projectId;

  // Used by the "Try again" button
  function refetch() {
    setResult(null);
    setReloadCount((count) => count + 1);
  }

  // Used after create, edit and delete: pass the new list, or a function that gets the current list
  function setTasks(next: Task[] | ((current: Task[]) => Task[])) {
    setResult((previous) => {
      const current = previous?.projectId === projectId ? previous.tasks : [];
      return {
        projectId,
        tasks: typeof next === "function" ? next(current) : next,
        error: null,
      };
    });
  }

  return {
    tasks: loading ? [] : result.tasks,
    error: loading ? null : result.error,
    loading,
    refetch,
    setTasks,
  };
}
