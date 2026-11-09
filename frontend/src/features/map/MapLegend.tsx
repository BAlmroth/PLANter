import { StatusIcon } from "../items/StatusIcon";
import { typeColorVar } from "../items/typeColor";
import type { Template } from "../items/types";
import styles from "./MapLegend.module.css";

// What the colors and shapes on the map mean. The item types come from the template.
// <details> is a native HTML element that can be opened and closed without any state in React.
// Closed by default so it does not cover the map. Click "Legend" to open it.
export function MapLegend({ template }: { template: Template }) {
  return (
    <details className={styles.legend}>
      <summary className={styles.summary}>Legend</summary>
      <ul className={styles.list}>
        {template.itemTypes.map((type) => (
          <li key={type.key} className={styles.type} style={typeColorVar(type.color)}>
            {type.label}
          </li>
        ))}
      </ul>
      <ul className={styles.list}>
        <li>
          <StatusIcon status="planned" showLabel />
          <span className={styles.note}>dashed border</span>
        </li>
        <li>
          <StatusIcon status="in_progress" showLabel />
        </li>
        <li>
          <StatusIcon status="done" showLabel />
        </li>
      </ul>
    </details>
  );
}
