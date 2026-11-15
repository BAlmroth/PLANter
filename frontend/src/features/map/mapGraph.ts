import { MarkerType, type Edge } from "@xyflow/react";
import type { Group } from "../groups/types";
import { getGroupsOfItem } from "../groups/itemGroups";
import type { Item, Template } from "../items/types";
import { getTypeColor } from "../items/typeColor";
import type { Relationship } from "../relationships/types";
import type { WarningsByItem } from "../warnings/types";
import { getCardSize } from "./cardSize";
import type { LayoutDirection } from "./tidyLayout";
import type { ItemNodeType } from "./types";
import { edgeLabel } from "../relationships/quantity";

// How faded the items and connections are that are not in focus (filtered out, or not connected to the selection)
export const FADED = 0.2;
// The "half state": an item connected to the selected item, but filtered out
export const HALF_FADED = 0.6;

// Pure functions that turn the project's data into what React Flow draws. No state and no requests,
// so they can be tested without rendering the map. MapView calls them inside useMemo.

// One node per item. The template is null while it is not loaded (every type is then "Unknown").
export function buildNodes(
  items: Item[],
  groups: Group[],
  template: Template | null,
  warnings: WarningsByItem,
  direction: LayoutDirection,
): ItemNodeType[] {
  const itemTypes = template?.itemTypes ?? [];

  return items.map((item): ItemNodeType => {
    return {
      id: item.id,
      type: "item",
      // The backend gives every new item a start position (services/itemLayout.ts),
      // so (0, 0) is a real position: the first row of the first column.
      position: { x: item.positionX, y: item.positionY },
      data: {
        title: item.title,
        category: item.type,
        // An unknown key is shown as "Unknown" instead of crashing (see CLAUDE.md)
        categoryLabel: itemTypes.find((type) => type.key === item.type)?.label ?? "Unknown",
        color: itemTypes.find((type) => type.key === item.type)?.color,
        status: item.status,
        groups: getGroupsOfItem(item.id, groups).map(({ id, name, color }) => ({ id, name, color })),
        warnings: (warnings.get(item.id) ?? []).map((warning) => warning.message),
        size: template ? getCardSize(template, item.type) : "medium",
        vertical: direction === "vertical",
      },
    };
  });
}

// One edge per relationship.
// How the lines are drawn. Both are built into React Flow:
// "smoothstep" = elbow lines (90 degree bends, rounded corners), "default" = smooth curves.
export type LineStyle = "smoothstep" | "default";

// matchingIds: the ids of the items that match the filters, or null when no filter is set.
// lineStyle: elbow lines unless the user picked curves in Manage.
export function buildEdges(
  relationships: Relationship[],
  items: Item[],
  template: Template | null,
  selectedNodeId: string | null,
  matchingIds: Set<string> | null,
  lineStyle: LineStyle = "smoothstep",
): Edge[] {
  // Item id -> item, to find the type (and so the color) of an edge's source item
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return relationships.map((relationship): Edge => {
    // Impact view: with a node selected, its own connections light up and the rest fade
    const touchesSelected =
      relationship.sourceItemId === selectedNodeId || relationship.targetItemId === selectedNodeId;
    // With a filter, a connection stays visible when at least one end matches,
    // so you can see what the matching items are connected to
    const touchesMatch =
      !matchingIds || matchingIds.has(relationship.sourceItemId) || matchingIds.has(relationship.targetItemId);
    // A type that reads backwards ("component belongs_to page") is drawn the other way round:
    // the line starts at the page and points to the component, with the reverse wording ("contains").
    // Only the drawing is turned. The saved connection keeps its direction.
    const relType = template?.relationshipTypes.find((type) => type.key === relationship.type);
    const drawnBackward = relType?.readsBackward === true;
    const fromId = drawnBackward ? relationship.targetItemId : relationship.sourceItemId;
    const toId = drawnBackward ? relationship.sourceItemId : relationship.targetItemId;
    const source = itemsById.get(fromId);
    const sourceColor = template && source ? getTypeColor(template, source.type) : undefined;
    return {
      id: relationship.id,
      source: fromId,
      target: toId,
      type: lineStyle,
      // An arrowhead at the target end, so you can see which way the connection goes
      markerEnd: { type: MarkerType.ArrowClosed },
      // The item the line starts at shows its wording: "uses" from the source's side, "contains" from the target's
      // With an amount: "ingredient in (20)"
      label: edgeLabel(relType ? (drawnBackward ? relType.inverseLabel : relType.label) : "Unknown", relationship.quantity),
      animated: touchesSelected,
      // A lit-up connection takes the color of its source item's type ("page uses design": page blue).
      // Unknown types fall back to the brand color.
      // With a filter, the filter decides what fades. Without one, the selection does.
      style:
        selectedNodeId && touchesSelected
          ? { stroke: sourceColor ?? "var(--primary)", strokeWidth: 3 }
          : (matchingIds ? !touchesMatch : selectedNodeId !== null)
            ? { opacity: FADED }
            : undefined,
    };
  });
}

// Fading instead of hiding keeps the whole map and its connections in view.
// With a filter, the filter decides and a selection only adds to it:
// - Matches the filter: never faded, even when another item is selected.
// - Filtered out, but connected to the selected item: half faded, so the connections can still be read.
// - Filtered out and not connected: faded.
// Without a filter: items not connected to the selected item fade.
// The selected item itself is never faded: you clicked it.
export function fadeNodes(
  nodes: ItemNodeType[],
  relationships: Relationship[],
  selectedNodeId: string | null,
  matchingIds: Set<string> | null,
): ItemNodeType[] {
  let connectedIds: Set<string> | null = null;
  if (selectedNodeId) {
    connectedIds = new Set([selectedNodeId]);
    for (const r of relationships) {
      if (r.sourceItemId === selectedNodeId) connectedIds.add(r.targetItemId);
      if (r.targetItemId === selectedNodeId) connectedIds.add(r.sourceItemId);
    }
  }
  return nodes.map((node) => {
    const connected = connectedIds?.has(node.id) ?? false;
    let opacity: number | undefined;
    if (node.id === selectedNodeId) {
      opacity = undefined;
    } else if (matchingIds) {
      if (!matchingIds.has(node.id)) opacity = connected ? HALF_FADED : FADED;
    } else if (connectedIds && !connected) {
      opacity = FADED;
    }
    return opacity === undefined ? node : { ...node, style: { ...node.style, opacity } };
  });
}
