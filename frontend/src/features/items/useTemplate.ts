import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { getTemplate } from "./itemsApi";
import type { Template } from "./types";

// The answer is stored together with the key it belongs to
type Result = { key: string; template: Template | null; error: string | null };

// Fetches a template (labels and category order) and keeps track of loading and error state.
export function useTemplate(key: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // If the component unmounts (or key / reloadCount changes) before the answer
    // arrives, cleanup sets this to true and the late answer is ignored.
    let cancelled = false;

    getTemplate(key)
      .then((template) => {
        if (cancelled) return;
        setResult({ key, template, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ key, template: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [key, reloadCount]);

  // Loading until there is an answer for THIS key
  const loading = result === null || result.key !== key;

  // Used by the "Try again" button
  function refetch() {
    setResult(null);
    setReloadCount((count) => count + 1);
  }

  return {
    template: loading ? null : result.template,
    error: loading ? null : result.error,
    loading,
    refetch,
  };
}