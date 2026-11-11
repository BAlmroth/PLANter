import type { Check } from "./types";

// Where the user goes to fix a check that has not passed.
// - Another page: `to` is relative to /projects/:id/checklist and `samePage` is false.
// - Further down the checklist page: `to` is "#<element id>" and `samePage` is true.
export type CheckLink = { to: string; label: string; samePage: boolean };

// The id of the Item warnings card on the checklist page, so the page and the link agree
export const ITEM_WARNINGS_ID = "item-warnings";

// The readiness keys are fixed in the backend code (services/checklist.ts), so they can be listed here.
// Category checks come from the template ("has_<type>"), so they all go to the item list,
// where "+ Add item" is. This is navigation only: the rules themselves stay in the backend.
const READINESS_LINKS: Record<string, CheckLink> = {
  has_mvp: { to: "../plan?view=list", label: "Go to items →", samePage: false },
  has_sprint: { to: "../tasks", label: "Go to tasks →", samePage: false },
  // These two point to the item warnings below: they list exactly which items are the problem
  // ("Login is part of the MVP but has no tasks", "Home has no components"), each linking to its item.
  mvp_has_tasks: { to: `#${ITEM_WARNINGS_ID}`, label: "See item warnings ↓", samePage: true },
  connections: { to: `#${ITEM_WARNINGS_ID}`, label: "See item warnings ↓", samePage: true },
};

// null for a check without a link (an unknown key), so the page simply shows no link
export function linkForCheck(check: Check): CheckLink | null {
  if (check.kind === "category") return { to: "../plan?view=list", label: "Add an item →", samePage: false };
  return READINESS_LINKS[check.key] ?? null;
}
