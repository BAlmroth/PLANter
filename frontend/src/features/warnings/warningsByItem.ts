import type { Warning, WarningsByItem } from "./types";

// Groups the flat list from the API by item id. An item without warnings has no entry.
export function groupWarningsByItem(warnings: Warning[]): WarningsByItem {
  const byItem: WarningsByItem = new Map();
  for (const warning of warnings) {
    byItem.set(warning.itemId, [...(byItem.get(warning.itemId) ?? []), warning]);
  }
  return byItem;
}
