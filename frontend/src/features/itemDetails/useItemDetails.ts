import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listItemDetails } from "./itemDetailsApi";
import type { ItemDetailRow } from "./types";

// The answer is stored together with the item it belongs to
type Result = { itemId: string; details: ItemDetailRow[]; error: string | null };

// Fetches an item's detail rows (its moodboard) and keeps track of loading and error state.
export function useItemDetails(itemId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old itemId is ignored (see useItems)
    let cancelled = false;

    listItemDetails(itemId)
      .then((details) => {
        if (!cancelled) setResult({ itemId, details, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ itemId, details: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, reloadCount]);

  const loading = result === null || result.itemId !== itemId;

  // Used by the "Try again" button
  function refetch() {
    setResult(null);
    setReloadCount((count) => count + 1);
  }

  // Used after add and delete: pass the new list, or a function that gets the current list
  function setDetails(next: ItemDetailRow[] | ((current: ItemDetailRow[]) => ItemDetailRow[])) {
    setResult((previous) => {
      const current = previous?.itemId === itemId ? previous.details : [];
      return { itemId, details: typeof next === "function" ? next(current) : next, error: null };
    });
  }

  return {
    details: loading ? [] : result.details,
    error: loading ? null : result.error,
    loading,
    refetch,
    setDetails,
  };
}
