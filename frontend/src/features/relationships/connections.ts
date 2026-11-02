import type { Item, Template } from "../items/types";
import type { Relationship } from "./types";

// One line under an item, for example { label: "uses", otherTitle: "Button", otherTypeLabel: "Component" }
export type Connection = { id: string; label: string; otherTitle: string; otherTypeLabel: string };

// All connections of one item, seen from that item's side:
// as the source it shows the label ("uses"), as the target the inverseLabel ("used by").
export function getConnections(
  itemId: string,
  relationships: Relationship[],
  items: Item[],
  template: Template,
): Connection[] {
  const connections: Connection[] = [];

  for (const relationship of relationships) {
    const isSource = relationship.sourceItemId === itemId;
    const isTarget = relationship.targetItemId === itemId;
    if (!isSource && !isTarget) continue;

    const otherId = isSource ? relationship.targetItemId : relationship.sourceItemId;
    const other = items.find((item) => item.id === otherId);
    // The other item may be gone (deleted after the list was loaded), so skip it
    if (!other) continue;

    const type = template.relationshipTypes.find((t) => t.key === relationship.type);
    connections.push({
      id: relationship.id,
      // An unknown key is shown as "Unknown" instead of crashing (see CLAUDE.md)
      label: type ? (isSource ? type.label : type.inverseLabel) : "Unknown",
      otherTitle: other.title,
      // Unknown type keys are shown as "Unknown" too
      otherTypeLabel: template.itemTypes.find((t) => t.key === other.type)?.label ?? "Unknown",
    });
  }

  return connections;
}

// One choice in the "Add connected item" form.
// Everything is read from the NEW item's side: "<new item> <verb> <this item>",
// for example "Button belongs to About" or "Home page is triggered by Button".
export type ConnectOption = {
  key: string; // unique within one item's options
  verb: string; // "belongs to" or "is triggered by": the relationship label or inverseLabel
  relationshipType: string; // template key of the relationship
  newItemType: string; // template key of the other item (the one that will be created, or picked)
  newItemTypeLabel: string; // for example "Component"
  thisItemTypeLabel: string; // the type label of the item the form is opened on
  newItemIsSource: boolean; // true: other item -> this item. false: this item -> other item.
};

// The relationships that can start or end at an item of this type, read from the template.
export function getConnectOptions(itemType: string, template: Template): ConnectOption[] {
  const typeLabel = (key: string) => template.itemTypes.find((t) => t.key === key)?.label ?? "Unknown";
  const options: ConnectOption[] = [];

  for (const combination of template.allowedCombinations) {
    const relationship = template.relationshipTypes.find((t) => t.key === combination.relationship);
    if (!relationship) continue;

    // This item is the target, so the new item is the source and uses the label ("belongs to")
    if (combination.target === itemType) {
      options.push({
        key: `new-source:${combination.relationship}:${combination.source}`,
        verb: relationship.label,
        relationshipType: combination.relationship,
        newItemType: combination.source,
        newItemTypeLabel: typeLabel(combination.source),
        thisItemTypeLabel: typeLabel(itemType),
        newItemIsSource: true,
      });
    }
    // This item is the source, so the new item is the target and uses the inverseLabel ("is triggered by")
    // Not "else if": a component can belong to a component, so both can be true
    if (combination.source === itemType) {
      options.push({
        key: `new-target:${combination.relationship}:${combination.target}`,
        verb: relationship.inverseLabel,
        relationshipType: combination.relationship,
        newItemType: combination.target,
        newItemTypeLabel: typeLabel(combination.target),
        thisItemTypeLabel: typeLabel(itemType),
        newItemIsSource: false,
      });
    }
  }

  return options;
}

// One entry per item type that can be connected, in the order of the options.
// Used by both forms for the "What is it?" / "Which type?" dropdown.
export function getTypeChoices(options: ConnectOption[]): ConnectOption[] {
  return options.filter(
    (option, index) => options.findIndex((o) => o.newItemType === option.newItemType) === index,
  );
}
