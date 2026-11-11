import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { getChecklist } from "./checklistApi";
import type { Check } from "./types";

// The answer is stored together with the project id it belongs to
type Result = { projectId: string; checks: Check[]; error: string | null };

// Fetches the checklist of one project. Same pattern as useWarnings.
// Used by the page that shows it, not shared through the project context: the page loads
// it when it opens, which is also when the items, tasks or sprints may have changed.
export function useChecklist(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer is ignored if the project changed or the component unmounted
    let cancelled = false;

    getChecklist(projectId)
      .then((checks) => {
        if (!cancelled) setResult({ projectId, checks, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, checks: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  const loading = result === null || result.projectId !== projectId;

  // Asks the backend again. The checks on screen stay until the new answer arrives.
  function refetch() {
    setReloadCount((count) => count + 1);
  }

  return {
    checks: loading ? [] : result.checks,
    error: loading ? null : result.error,
    loading,
    refetch,
  };
}
