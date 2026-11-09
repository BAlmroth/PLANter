import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StatusIcon } from "../items/StatusIcon";
import { WarningBadge } from "../warnings/WarningBadge";
import type { ItemNodeType } from "./types";

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
        // Neutral border: the status is the icon below, the type color comes in the map step
        border: "2px solid var(--border)",
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
      <div>
        <StatusIcon status={data.status} showLabel />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
