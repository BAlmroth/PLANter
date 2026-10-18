import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CATEGORY_LABELS, type ItemNodeType, type ItemStatus } from "./mockData";

const STATUS_LABELS: Record<ItemStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  planned: "#9ca3af",
  in_progress: "#f59e0b",
  done: "#22c55e",
};

// Custom node for one item. React Flow renders this for every node with type "item"
// and passes the node's `data` as a prop.
export function ItemNode({ data }: NodeProps<ItemNodeType>) {
  return (
    <div
      style={{
        padding: "8px 12px",
        minWidth: 150,
        background: "#fff",
        color: "#08060d",
        border: `2px solid ${STATUS_COLORS[data.status]}`,
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {/* Handles are the dots where edges attach. Edges need them to connect. */}
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>
        {/* Unknown keys must not crash the UI (see CLAUDE.md), so fall back to "Unknown". */}
        {CATEGORY_LABELS[data.category] ?? "Unknown"}
      </div>
      <strong>{data.title}</strong>
      <div style={{ fontSize: 12, color: STATUS_COLORS[data.status] }}>
        {STATUS_LABELS[data.status]}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
