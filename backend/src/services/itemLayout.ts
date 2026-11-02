// Where a new item appears on the map: one column per item type (in template order),
// and the first free row in that column. Same spacing the map used before.
export const COLUMN_WIDTH = 220;
export const ROW_HEIGHT = 110;

type Position = { positionX: number; positionY: number };

// itemTypeKeys: the template's item type keys, in order.
// existing: positions of the items of the same type that are already in the project.
export function startPosition(itemTypeKeys: string[], type: string, existing: Position[]) {
  // An unknown type goes in the first column (the type itself is rejected elsewhere)
  const x = Math.max(0, itemTypeKeys.indexOf(type)) * COLUMN_WIDTH;

  // Take the first row where no item of this type sits in this column.
  // Counting items would put a new item on top of another one after a delete.
  let row = 0;
  while (existing.some((p) => p.positionX === x && p.positionY === row * ROW_HEIGHT)) {
    row++;
  }
  return { positionX: x, positionY: row * ROW_HEIGHT };
}
