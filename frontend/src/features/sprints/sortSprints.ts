import type { Sprint } from "./types";

// The same order as the API (sortByName in backend/src/services/sprints.ts): numbers count as
// numbers ("Sprint 2" before "Sprint 10") and case does not matter. Used after a create or rename,
// so a new sprint lands where it will be after a reload, not at the bottom.
const nameCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export function sortSprints(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort((a, b) => nameCollator.compare(a.name, b.name));
}
