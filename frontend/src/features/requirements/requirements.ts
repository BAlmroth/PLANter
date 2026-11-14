import type { Item, Template } from "../items/types";
import { getConnections, type ConnectOption, type Connection } from "../relationships/connections";
import type { Relationship } from "../relationships/types";

// The Requirements card: "what does it take to get this item?". It shows ordinary connections
// (so the map, the other item and the loop check still work), picked out by the template's
// `requirement` field. The web template has none, so a web item never has the card.

// One row of the card, for example "made from: 20 × Wood, 5 × Stone".
export type RequirementRow = {
  relationshipType: string; // template key, for example "made_from"
  label: string; // from this item's side: "made from", or "unlocked by" for an incoming one
  hasQuantity: boolean; // can the entries have an amount?
  entries: Connection[];
  // The choices for "+ Add", limited to this one connection type and side
  options: ConnectOption[];
};

// Is this connection one of this item's requirements? Outgoing types count when the item is the
// source, incoming ones when it is the target. "House 2 made from Wood" is House 2's requirement, not Wood's.
export function isRequirement(relationship: Relationship, itemId: string, template: Template): boolean {
  const side = template.relationshipTypes.find((t) => t.key === relationship.type)?.requirement;
  if (side === "outgoing") return relationship.sourceItemId === itemId;
  if (side === "incoming") return relationship.targetItemId === itemId;
  return false;
}

// Would this "add a connection" choice create one of this item's requirements?
// newItemIsSource: the other item is the source, so this item is the target (incoming).
export function isRequirementOption(option: ConnectOption, template: Template): boolean {
  const side = template.relationshipTypes.find((t) => t.key === option.relationshipType)?.requirement;
  if (side === "outgoing") return !option.newItemIsSource;
  if (side === "incoming") return option.newItemIsSource;
  return false;
}

// The rows of the card for one item. A row is only there when the template allows that connection
// for this item's type (a Character can cost something, but is never "made from"). No rows = no card.
export function getRequirementRows(
  item: Item,
  relationships: Relationship[],
  items: Item[],
  template: Template,
  connectOptions: ConnectOption[],
): RequirementRow[] {
  const rows: RequirementRow[] = [];

  for (const type of template.relationshipTypes) {
    if (!type.requirement) continue;
    const options = connectOptions.filter(
      (option) => option.relationshipType === type.key && isRequirementOption(option, template),
    );
    if (options.length === 0) continue;

    const own = relationships.filter((r) => r.type === type.key && isRequirement(r, item.id, template));
    rows.push({
      relationshipType: type.key,
      label: type.requirement === "outgoing" ? type.label : type.inverseLabel,
      hasQuantity: type.hasQuantity === true,
      entries: getConnections(item.id, own, items, template),
      options,
    });
  }

  return rows;
}
