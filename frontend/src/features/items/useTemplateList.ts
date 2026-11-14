import { useEffect, useState } from "react";
import { listTemplates } from "./itemsApi";
import type { TemplateSummary } from "./types";

// The templates to choose between (key, label, description), for the new-project page and the Help page.
// Empty while loading and if the request fails: both pages then simply show no choice, and work as before.
export function useTemplateList(): TemplateSummary[] {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    listTemplates()
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return templates;
}
