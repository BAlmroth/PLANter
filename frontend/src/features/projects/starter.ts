import type { Template } from "../items/types";
import type { CreateProjectInput } from "./types";

// "Already got a good idea?": what the user has added on the new-project page, before it is sent.
// Plain lists of names. Item names are kept per item type key, so each category has its own list.
export type Starter = {
  items: Record<string, string[]>;
  groups: string[];
  tasks: string[];
};

export const EMPTY_STARTER: Starter = { items: {}, groups: [], tasks: [] };

// Same limit as the backend (MAX_STARTER_ENTRIES): per list, and all item types together are one list
export const MAX_ENTRIES = 50;

// Adds a name to a list. Returns the same list when there is nothing to add:
// an empty name, a name already in the list (any case), or a full list.
export function addEntry(list: string[], text: string, max = MAX_ENTRIES): string[] {
  const name = text.trim();
  if (name === "" || list.length >= max) return list;
  if (list.some((existing) => existing.toLowerCase() === name.toLowerCase())) return list;
  return [...list, name];
}

// How many items there are in all categories together (the backend caps them as one list)
export function itemCount(starter: Starter): number {
  return Object.values(starter.items).reduce((sum, names) => sum + names.length, 0);
}

// The request body for POST /api/projects. Items follow the template's category order.
// Lists that are empty are left out, so an empty starter sends the same body as before.
// template is null when it has not loaded: then no items are sent ("Create empty project" works anyway).
export function toCreateInput(
  basics: { name: string; description: string; template: string },
  starter: Starter,
  template: Template | null,
): CreateProjectInput {
  const items = (template?.itemTypes ?? []).flatMap((type) =>
    (starter.items[type.key] ?? []).map((title) => ({ type: type.key, title })),
  );
  return {
    name: basics.name,
    template: basics.template,
    ...(basics.description !== "" && { description: basics.description }),
    ...(items.length > 0 && { items }),
    ...(starter.groups.length > 0 && { groups: starter.groups.map((name) => ({ name })) }),
    ...(starter.tasks.length > 0 && { tasks: starter.tasks.map((title) => ({ title })) }),
  };
}

// "2 pages, 1 component and 1 task", or null when nothing has been added.
// Uses the template's labels (lower case), so no item type names are hard-coded.
export function starterSummary(starter: Starter, template: Template): string | null {
  const count = (n: number, one: string, many: string) => `${n} ${(n === 1 ? one : many).toLowerCase()}`;
  const parts = [
    ...template.itemTypes
      .filter((type) => (starter.items[type.key]?.length ?? 0) > 0)
      .map((type) => count(starter.items[type.key].length, type.label, type.pluralLabel)),
    ...(starter.groups.length > 0 ? [count(starter.groups.length, "group", "groups")] : []),
    ...(starter.tasks.length > 0 ? [count(starter.tasks.length, "task", "tasks")] : []),
  ];
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
