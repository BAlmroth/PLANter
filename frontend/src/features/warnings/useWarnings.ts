import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../lib/api";
import type { Warning, WarningsByItem } from "./types";
import { getWarnings } from "./warningsApi";
import { groupWarningsByItem } from "./warningsByItem";

// The answer is stored together with the project id it belongs to
type Result = { projectId: string; warnings: Warning[]; error: string | null };

// Fetches the warnings of one project. Same pattern as useProgress.
// Warnings are a hint, not core data: while loading or after an error the list is empty,
// so the views simply show no badges instead of blocking.
export function useWarnings(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer is ignored if the project changed or the component unmounted
    let cancelled = false;

    getWarnings(projectId)
      .then((warnings) => {
        if (!cancelled) setResult({ projectId, warnings, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, warnings: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  const loading = result === null || result.projectId !== projectId;
  const warnings = useMemo(() => (loading ? [] : result.warnings), [loading, result]);
  const byItem: WarningsByItem = useMemo(() => groupWarningsByItem(warnings), [warnings]);

  // Asks the backend again. The badges on screen stay until the new answer arrives.
  function refetch() {
    setReloadCount((count) => count + 1);
  }

  return { warnings, byItem, error: loading ? null : result.error, loading, refetch };
}
