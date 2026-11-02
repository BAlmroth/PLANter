import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { getProgress } from "./progressApi";
import type { Progress } from "./types";

// The answer is stored together with the project id it belongs to
type Result = { projectId: string; progress: Progress | null; error: string | null };

// Fetches the progress of one project and keeps track of loading and error state.
export function useProgress(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // If the component unmounts (or projectId / reloadCount changes) before the answer
    // arrives, cleanup sets this to true and the late answer is ignored.
    let cancelled = false;

    getProgress(projectId)
      .then((progress) => {
        if (!cancelled) setResult({ projectId, progress, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, progress: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  // Loading until there is an answer for THIS projectId
  const loading = result === null || result.projectId !== projectId;

  // Asks the backend again. The numbers already on screen stay until the new answer arrives,
  // so the header bar does not flicker when the view changes.
  function refetch() {
    setReloadCount((count) => count + 1);
  }

  return {
    progress: loading ? null : result.progress,
    error: loading ? null : result.error,
    loading,
    refetch,
  };
}
