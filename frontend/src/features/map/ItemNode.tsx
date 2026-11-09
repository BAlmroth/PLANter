import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StatusIcon } from "../items/StatusIcon";
import { typeColorVar } from "../items/typeColor";
import { WarningBadge } from "../warnings/WarningBadge";
import type { ItemNodeType } from "./types";
import styles from "./ItemNode.module.css";

// Custom node for one item. React Flow renders this for every node with type "item"
// and passes the node's `data` as a prop.
export function ItemNode({ data }: NodeProps<ItemNodeType>) {
  const className = data.status === "planned" ? `${styles.node} ${styles.planned}` : styles.node;

  return (
    <div className={className} style={typeColorVar(data.color)}>
      {/* Handles are the dots where edges attach. Edges need them to connect.
          Arrows leave on the right and enter on the left, so they run left to right like the columns. */}
      <Handle type="target" position={Position.Left} />
      <div className={styles.top}>
        <span className={styles.type}>{data.categoryLabel}</span>
        <WarningBadge messages={data.warnings} />
      </div>
      <strong className={styles.title}>{data.title}</strong>
      <StatusIcon status={data.status} showLabel />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
