import type { Group } from "../groups/types";
import type { Item, Template } from "./types";

// How the File view is divided: by item type or by group
export type FileViewMode = "category" | "group";

// One card in the File view
export type FileSection = {
  key: string;
  title: string;
  // Only groups have one
  description: string | null;
  items: Item[];
};

// Category: one section per item type in the template, and "Unknown" for items whose type is not in it.
// Group: one section per group (an item in two groups is in both), and "No group" last.
// Empty sections are kept, except "Unknown" and "No group", which only show when they have items.
export function getFileSections(mode: FileViewMode, items: Item[], template: Template, groups: Group[]): FileSection[] {
  if (mode === "group") {
    const sections: FileSection[] = groups.map((group) => ({
      key: group.id,
      title: group.name,
      description: group.description,
      items: items.filter((item) => group.itemIds.includes(item.id)),
    }));
    const noGroup = items.filter((item) => !groups.some((group) => group.itemIds.includes(item.id)));
    return noGroup.length > 0
      ? [...sections, { key: "no-group", title: "No group", description: null, items: noGroup }]
      : sections;
  }

  const sections: FileSection[] = template.itemTypes.map((type) => ({
    key: type.key,
    title: type.pluralLabel,
    description: null,
    items: items.filter((item) => item.type === type.key),
  }));
  const knownKeys = template.itemTypes.map((type) => type.key);
  const unknown = items.filter((item) => !knownKeys.includes(item.type));
  return unknown.length > 0
    ? [...sections, { key: "unknown", title: "Unknown", description: null, items: unknown }]
    : sections;
}
