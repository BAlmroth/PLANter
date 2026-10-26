import { Link } from "react-router-dom";
import type { Connection } from "../relationships/connections";
import type { Item, ItemStatus } from "./types";

const STATUS_LABELS: Record<ItemStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
};

type Props = {
  projectId: string;
  item: Item;
  connections: Connection[];
};

// One item in the File view. Read-only: editing, deleting and connecting happen in the detail view.
export function ItemRow({ projectId, item, connections }: Props) {
  return (
    <li>
      <h3>
        <Link to={`/projects/${projectId}/items/${item.id}`}>{item.title}</Link>
      </h3>
      <p>
        {STATUS_LABELS[item.status]}
        {item.isMvp && " · MVP"}
      </p>
      {item.description && <p>{item.description}</p>}
      {connections.length > 0 && (
        <ul>
          {connections.map((connection) => (
            <li key={connection.id}>
              {connection.label}: {connection.otherTitle} ({connection.otherTypeLabel})
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
