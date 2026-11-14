// "Tidy up": computes a layout for the map from the connections.
// A pure function (no React, no API) so it is easy to test. The caller saves the positions.
//
// Idea (a "layered layout"):
//   1. Give every item a level. An item is one level after the items that point at it,
//      so arrows go from level to level in one direction.
//   2. Within a level, order the items so connected items end up near each other.
//   3. Items with no connections at all are parked in their own level at the end.
//   4. Turn levels and places into x and y, using the real size of each card so big cards
//      (pages) never overlap their neighbours.

import { CARD_DIMENSIONS, type CardSize } from "./cardSize";

// Room between two levels. Larger than between neighbours: the line labels sit there.
export const LEVEL_GAP_HORIZONTAL = 100;
export const LEVEL_GAP_VERTICAL = 90;
// Room between two cards in the same level
export const ITEM_GAP_HORIZONTAL = 30; // columns: cards stacked in a column
export const ITEM_GAP_VERTICAL = 40; // rows: cards side by side

// "horizontal": levels are columns, the flow goes left to right.
// "vertical": levels are rows, the flow goes from top to bottom.
export type LayoutDirection = "horizontal" | "vertical";

type LayoutItem = { id: string; size?: CardSize };
type LayoutEdge = { sourceItemId: string; targetItemId: string };
export type LayoutPosition = { positionX: number; positionY: number };

export function tidyLayout(
  items: LayoutItem[],
  edges: LayoutEdge[],
  direction: LayoutDirection = "horizontal",
): Map<string, LayoutPosition> {
  const ids = new Set(items.map((item) => item.id));
  // Ignore edges to unknown items and edges from an item to itself
  const usable = edges.filter(
    (e) => e.sourceItemId !== e.targetItemId && ids.has(e.sourceItemId) && ids.has(e.targetItemId),
  );

  // Outgoing and incoming neighbours per item
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const item of items) {
    outgoing.set(item.id, []);
    incoming.set(item.id, []);
  }
  for (const e of usable) {
    outgoing.get(e.sourceItemId)!.push(e.targetItemId);
    incoming.get(e.targetItemId)!.push(e.sourceItemId);
  }

  // Step 1: levels. Some relationship types allow cycles (A triggers B triggers A), and a cycle
  // would push the levels up forever. So we skip "back edges": edges that lead back to an item
  // we are still visiting in the depth-first search below.
  const levels = new Map<string, number>();
  const state = new Map<string, "visiting" | "done">();

  // Level of an item = 1 + the highest level of the items pointing at it (0 if none)
  function levelOf(id: string): number {
    const known = levels.get(id);
    if (known !== undefined) return known;
    state.set(id, "visiting");
    let level = 0;
    for (const from of incoming.get(id)!) {
      if (state.get(from) === "visiting") continue; // back edge: part of a cycle, skip it
      level = Math.max(level, levelOf(from) + 1);
    }
    state.set(id, "done");
    levels.set(id, level);
    return level;
  }
  for (const item of items) levelOf(item.id);

  // Step 3 first: unconnected items are kept apart from the rest
  const connected = items.filter((item) => outgoing.get(item.id)!.length + incoming.get(item.id)!.length > 0);
  const isolated = items.filter((item) => !connected.includes(item));

  // Group the connected items per level, keeping the original order as the starting order
  const maxLevel = Math.max(-1, ...connected.map((item) => levels.get(item.id)!));
  const columns: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (const item of connected) columns[levels.get(item.id)!].push(item.id);

  // Step 2: order each level. Level by level, so the neighbours before it already have a place.
  // An item is sorted by the average place of its neighbours that are already placed.
  const row = new Map<string, number>();
  columns.forEach((column, columnIndex) => {
    const score = (id: string) => {
      const placed = incoming.get(id)!.filter((from) => row.has(from) && levels.get(from)! < columnIndex);
      if (placed.length === 0) return Number.POSITIVE_INFINITY; // no placed neighbour: keep at the end
      return placed.reduce((sum, from) => sum + row.get(from)!, 0) / placed.length;
    };
    // Array.sort is stable, so items with the same score keep their original order
    column.sort((a, b) => (columnIndex === 0 ? 0 : score(a) - score(b)));
    column.forEach((id, index) => row.set(id, index));
  });

  // Step 4: positions. The unconnected items are the last level.
  const sizeById = new Map(items.map((item) => [item.id, CARD_DIMENSIONS[item.size ?? "medium"]]));
  const allLevels = isolated.length > 0 ? [...columns, isolated.map((item) => item.id)] : columns;
  const horizontal = direction === "horizontal";
  const positions = new Map<string, LayoutPosition>();

  // `start` is where the current level begins along the flow (x for columns, y for rows).
  // `along` is the position inside the level (y in a column, x in a row).
  let start = 0;
  for (const level of allLevels) {
    let along = 0;
    let levelDepth = 0; // how far the level reaches along the flow: its widest (or tallest) card
    for (const id of level) {
      const { width, height } = sizeById.get(id)!;
      positions.set(
        id,
        horizontal ? { positionX: start, positionY: along } : { positionX: along, positionY: start },
      );
      along += (horizontal ? height + ITEM_GAP_HORIZONTAL : width + ITEM_GAP_VERTICAL);
      levelDepth = Math.max(levelDepth, horizontal ? width : height);
    }
    start += levelDepth + (horizontal ? LEVEL_GAP_HORIZONTAL : LEVEL_GAP_VERTICAL);
  }
  return positions;
}
