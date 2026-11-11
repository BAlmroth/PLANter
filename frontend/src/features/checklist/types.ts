// Same shape as the backend's Check (services/checklist.ts)

// "category": the project has no item of a category it usually needs ("Yet to plan").
// "readiness": the rest of the "Before you start programming" list.
export type CheckKind = "category" | "readiness";

export type Check = {
  key: string; // stable, for example "has_testing". Labels can change, keys do not.
  kind: CheckKind;
  label: string; // a todo, for example "Plan the tests"
  passed: boolean;
};
