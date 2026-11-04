import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listSprints } from "./sprintsApi";
import type { Sprint } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; sprints: Sprint[]; error: string | null };

// Fetches a project's sprints and keeps track of loading and error state.
export function useSprints(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    listSprints(projectId)
      .then((sprints) => {
        if (!cancelled) setResult({ projectId, sprints, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, sprints: [], error });
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
  function setSprints(next: Sprint[] | ((current: Sprint[]) => Sprint[])) {
    setResult((previous) => {
      const current = previous?.projectId === projectId ? previous.sprints : [];
      return {
        projectId,
        sprints: typeof next === "function" ? next(current) : next,
        error: null,
      };
    });
  }

  return {
    sprints: loading ? [] : result.sprints,
    error: loading ? null : result.error,
    loading,
    refetch,
    setSprints,
  };
}
