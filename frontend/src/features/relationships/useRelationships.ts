import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listRelationships } from "./relationshipsApi";
import type { Relationship } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; relationships: Relationship[]; error: string | null };

// Fetches a project's relationships and keeps track of loading and error state (same idea as useItems).
export function useRelationships(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    listRelationships(projectId)
      .then((relationships) => {
        if (!cancelled) setResult({ projectId, relationships, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, relationships: [], error });
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

  return {
    relationships: loading ? [] : result.relationships,
    error: loading ? null : result.error,
    loading,
    refetch,
  };
}
