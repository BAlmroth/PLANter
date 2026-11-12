// Same shape as the backend's Warning (services/warnings.ts)
export type Warning = {
  rule: string; // for example "page_without_components"
  itemId: string;
  itemTitle: string;
  message: string; // shown after the item, for example "has no components"
};

// The warnings of each item, so a card or node can look up its own
export type WarningsByItem = Map<string, Warning[]>;
