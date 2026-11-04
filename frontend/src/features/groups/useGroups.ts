import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listGroups } from "./groupsApi";
import type { Group } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; groups: Group[]; error: string | null };

// Fetches a project's groups and keeps track of loading and error state.
export function useGroups(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    listGroups(projectId)
      .then((groups) => {
        if (!cancelled) setResult({ projectId, groups, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, groups: [], error });
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

  // Used after create, edit, delete and add/remove item: pass the new list, or a function that gets the current list
  function setGroups(next: Group[] | ((current: Group[]) => Group[])) {
    setResult((previous) => {
      const current = previous?.projectId === projectId ? previous.groups : [];
      return {
        projectId,
        groups: typeof next === "function" ? next(current) : next,
        error: null,
      };
    });
  }

  return {
    groups: loading ? [] : result.groups,
    error: loading ? null : result.error,
    loading,
    refetch,
    setGroups,
  };
}
