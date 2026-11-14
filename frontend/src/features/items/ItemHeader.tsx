import { GroupChips } from "../groups/GroupChip";
import type { Group } from "../groups/types";
import type { Item, ItemStatus, Template } from "./types";
import { TypeBadge } from "./TypeBadge";
import styles from "./ItemDetail.module.css";

type Props = {
  item: Item;
  template: Template;
  groups: Group[];
  // true while a request in the parent is running
  busy: boolean;
  error: string | null;
  onSetStatus: (status: ItemStatus, checked: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
};

// The top of the item page: title and badges on the left, status checkboxes and actions on the right.
export function ItemHeader({ item, template, groups, busy, error, onSetStatus, onDelete, onEdit }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{item.title}</h1>
          <TypeBadge typeKey={item.type} template={template} />
          {item.isMvp && <span className={styles.mvp}>MVP</span>}
          <GroupChips groups={groups} />
        </div>
      </div>

      <div className={styles.headerActions}>
        {/* Two checkboxes cover three statuses: neither checked means "planned" */}
        {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
        <div className={styles.status} data-tour="item-status">
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={item.status === "in_progress"}
              disabled={busy}
              onChange={(e) => onSetStatus("in_progress", e.target.checked)}
            />
            In progress
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={item.status === "done"}
              disabled={busy}
              onChange={(e) => onSetStatus("done", e.target.checked)}
            />
            Done
          </label>
        </div>
        <button type="button" className={styles.danger} onClick={onDelete} disabled={busy}>
          Delete
        </button>
        <button type="button" onClick={onEdit} disabled={busy} data-tour="item-edit">
          Edit item
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </header>
  );
}
