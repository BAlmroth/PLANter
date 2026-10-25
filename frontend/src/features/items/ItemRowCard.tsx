import type { Item } from "./types";

export function ItemRow({ item }: { item: Item }) {
  return (
    <li>
      <h3>{item.title}</h3> · {item.status.replace("_", " ")}
      {item.isMvp && " · MVP"}
      {item.description && <p>{item.description}</p>}
    </li>
  );
}