import type { Item, Template } from "../items/types";
import type { Relationship } from "./types";

// One line under an item, for example { label: "uses", otherTitle: "Button" }
export type Connection = { id: string; label: string; otherTitle: string };

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
    });
  }

  return connections;
}
