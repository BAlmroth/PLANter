import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listItems } from "./itemsApi";
import type { Item } from "./types";

//fetch items from a logged in users project. keep track of loading and error state.
//logic of item list on file view page

type Result = { projectId: string; items: Item[]; error: string | null };

export function useItems(projectId: string) {
    const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // If the component unmounts (or projectId / reloadCount changes) before the answer arrives,
    // cleanup sets this to true and the late answer is ignored.
    let cancelled = false;

        listItems(projectId)
      .then((items) => {
        if (!cancelled) setResult({ projectId, items, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, items: [], error });
      });
      return () => {
        cancelled = true;
      };
  },[projectId, reloadCount] );

    // Loading until there is an answer for THIS projectId
  const loading = result === null || result.projectId !== projectId;

  // Used by the "Try again" button
  function refetch() {
    setResult(null);
    setReloadCount((count) => count + 1);
  }

  // Used after create, edit and delete: the page passes in the new list
  function setItems(items: Item[]) {
    setResult({ projectId, items, error: null });
  }

  return {
    items: loading ? [] : result.items,
    error: loading ? null : result.error,
    loading,
    refetch,
    setItems,
  };
}