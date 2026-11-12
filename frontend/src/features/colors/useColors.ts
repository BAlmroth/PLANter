import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { listColors, listItemColors } from "./colorsApi";
import type { ItemColorLink, ProjectColor } from "./types";

// The answer is stored together with the project it belongs to
type Result = { projectId: string; colors: ProjectColor[]; links: ItemColorLink[]; error: string | null };

// Fetches a project's palette and which items use which colors, and keeps track of loading and error state.
// They are loaded together because they are used together (for example "used by 3 items").
export function useColors(projectId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // A late answer for an old projectId is ignored (see useItems)
    let cancelled = false;

    Promise.all([listColors(projectId), listItemColors(projectId)])
      .then(([colors, links]) => {
        if (!cancelled) setResult({ projectId, colors, links, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.message : "Something went wrong.";
        setResult({ projectId, colors: [], links: [], error });
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

  // Used after add, delete, link and unlink: pass the new list, or a function that gets the current list
  function setColors(next: ProjectColor[] | ((current: ProjectColor[]) => ProjectColor[])) {
    setResult((previous) => {
      if (previous?.projectId !== projectId) return previous;
      return { ...previous, colors: typeof next === "function" ? next(previous.colors) : next, error: null };
    });
  }
  function setLinks(next: ItemColorLink[] | ((current: ItemColorLink[]) => ItemColorLink[])) {
    setResult((previous) => {
      if (previous?.projectId !== projectId) return previous;
      return { ...previous, links: typeof next === "function" ? next(previous.links) : next, error: null };
    });
  }

  return {
    colors: loading ? [] : result.colors,
    links: loading ? [] : result.links,
    error: loading ? null : result.error,
    loading,
    refetch,
    setColors,
    setLinks,
  };
}
