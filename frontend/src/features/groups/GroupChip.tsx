import { groupColorVar } from "./groupColor";
import type { Group } from "./types";
import styles from "./GroupChip.module.css";

// A group's name with a dot in the group's color in front, for example "● Navigation".
// Groups get a dot, item types get a pill or strip, so the two never look the same.
export function GroupChip({ group }: { group: Pick<Group, "name" | "color"> }) {
  return (
    <span className={styles.chip} style={groupColorVar(group.color)}>
      {group.name}
    </span>
  );
}

// Several chips in a row, for example all groups of one item. Nothing when there are none.
export function GroupChips({ groups }: { groups: Pick<Group, "id" | "name" | "color">[] }) {
  if (groups.length === 0) return null;
  return (
    <span className={styles.chips}>
      {groups.map((group) => (
        <GroupChip key={group.id} group={group} />
      ))}
    </span>
  );
}
