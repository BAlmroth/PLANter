import type { CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { groupColorVar } from "../groups/groupColor";
import { StatusIcon } from "../items/StatusIcon";
import { typeColorVar } from "../items/typeColor";
import { WarningBadge } from "../warnings/WarningBadge";
import { CARD_DIMENSIONS } from "./cardSize";
import type { ItemNodeType } from "./types";
import styles from "./ItemNode.module.css";

// Custom node for one item. React Flow renders this for every node with type "item"
// and passes the node's `data` as a prop.
export function ItemNode({ data }: NodeProps<ItemNodeType>) {
  const className = [styles.node, styles[data.size], data.status === "planned" && styles.planned]
    .filter(Boolean)
    .join(" ");

  // --card-width is the width of the size, the same number tidyLayout uses to space the cards
  return (
    <div
      className={className}
      style={{ ...typeColorVar(data.color), "--card-width": `${CARD_DIMENSIONS[data.size].width}px` } as CSSProperties}
    >
      {/* Handles are the dots where edges attach. Edges need them to connect.
          Arrows leave on the right and enter on the left (left to right map),
          or leave at the bottom and enter at the top (top to bottom map). */}
      <Handle type="target" position={data.vertical ? Position.Top : Position.Left} />
      <div className={styles.top}>
        <span className={styles.type}>{data.categoryLabel}</span>
        {/* One dot per group in the group's color. The name shows on hover (title) and is read by screen readers. */}
        {data.groups.length > 0 && (
          <span className={styles.groups} role="img" aria-label={`Groups: ${data.groups.map((g) => g.name).join(", ")}`}>
            {data.groups.map((group) => (
              <span key={group.id} className={styles.groupDot} style={groupColorVar(group.color)} title={group.name} />
            ))}
          </span>
        )}
        <WarningBadge messages={data.warnings} />
      </div>
      <strong className={styles.title}>{data.title}</strong>
      <StatusIcon status={data.status} showLabel />
      <Handle type="source" position={data.vertical ? Position.Bottom : Position.Right} />
    </div>
  );
}
