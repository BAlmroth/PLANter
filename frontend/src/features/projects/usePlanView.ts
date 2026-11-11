import { useSearchParams } from "react-router-dom";

// The List / Map switch of the Items page, shown in the sub header. The choice is kept in the URL
// (?view=map), so a refresh or a shared link opens the same view. The list is the default.
export function usePlanView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";
  return { view, setView: (next: "list" | "map") => setSearchParams({ view: next }, { replace: true }) } as const;
}
