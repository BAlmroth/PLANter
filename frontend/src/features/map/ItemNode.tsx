import { Handle, Position, type NodeProps } from "@xyflow/react";
import { STATUS_LABELS, type ItemStatus } from "../items/types";
import { WarningBadge } from "../warnings/WarningBadge";
import type { ItemNodeType } from "./types";

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
      {/* Handles are the dots where edges attach. Edges need them to connect.
          Arrows leave on the right and enter on the left, so they run left to right like the columns. */}
      <Handle type="target" position={Position.Left} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>{data.categoryLabel}</span>
        <WarningBadge messages={data.warnings} />
      </div>
      <strong>{data.title}</strong>
      <div style={{ fontSize: 12, color: STATUS_COLORS[data.status] }}>
        {STATUS_LABELS[data.status]}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
