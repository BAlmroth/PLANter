import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { getProject } from "./projectsApi";
import type { Project } from "./types";

type Result = {
  id: string;
  project: Project | null;
  error: { status: number; message: string } | null;
};

export function useProject(id: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {

    let cancelled = false;

    getProject(id)
      .then((project) => {
        if (!cancelled) setResult({ id, project, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error =
          err instanceof ApiError
            ? { status: err.status, message: err.message }
            : { status: 0, message: "Something went wrong." };
        setResult({ id, project: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadCount]);

  const loading = result === null || result.id !== id;

  // Used by the "Try again" button: forget the answer and ask again
  function refetch() {
    setResult(null);
    setReloadCount((count) => count + 1);
  }

  return {
    project: loading ? null : result.project,
    error: loading ? null : result.error,
    loading,
    refetch,
  };
}
