import type { Check } from "./types";

// The categories the project still has no item of: the failed "category" checks, in template order.
// The readiness checks are left out here, they are only on the full checklist page.
export function getYetToPlan(checks: Check[]): Check[] {
  return checks.filter((check) => check.kind === "category" && !check.passed);
}
