import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listInspirations } from "./inspirationsApi";
import type { Inspiration } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; inspirations: Inspiration[]; error: string | null };

// Fetches a project's inspirations and keeps track of loading and error state.
export function useInspirations(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    listInspirations(projectId)
      .then((inspirations) => {
        if (!cancelled) setResult({ projectId, inspirations, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, inspirations: [], error });
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

  // Used after create and delete: pass the new list, or a function that gets the current list
  function setInspirations(next: Inspiration[] | ((current: Inspiration[]) => Inspiration[])) {
    setResult((previous) => {
      const current = previous?.projectId === projectId ? previous.inspirations : [];
      return {
        projectId,
        inspirations: typeof next === "function" ? next(current) : next,
        error: null,
      };
    });
  }

  return {
    inspirations: loading ? [] : result.inspirations,
    error: loading ? null : result.error,
    loading,
    refetch,
    setInspirations,
  };
}
