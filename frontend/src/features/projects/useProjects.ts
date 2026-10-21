import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listProjects } from "./projectsApi";
import type { Project } from "./types";

// Fetches the logged-in user's projects and keeps track of loading and error state.
// Pages use this instead of calling listProjects() and handling state themselves.
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // If the component unmounts (or reloadCount changes) before the answer arrives,
    // cleanup sets this to true and the late answer is ignored.
    let cancelled = false;

    listProjects()
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  // Used by the "Try again" button
  function refetch() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  return { projects, loading, error, refetch };
}
