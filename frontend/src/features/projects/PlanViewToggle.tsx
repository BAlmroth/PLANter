import { usePlanView } from "./usePlanView";
import styles from "./PlanViewToggle.module.css";

// The List / Map switch of the Items page, shown in the sub header. The view itself lives in usePlanView.
export function PlanViewToggle() {
  const { view, setView } = usePlanView();

  return (
    <div className={styles.toggle} role="group" aria-label="Plan view">
      {(["list", "map"] as const).map((option) => (
        <button
          key={option}
          type="button"
          className={option === view ? `${styles.option} ${styles.active}` : styles.option}
          aria-pressed={option === view}
          // replace: switching views should not fill up the back button history
          onClick={() => setView(option)}
        >
          {option === "list" ? "List" : "Map"}
        </button>
      ))}
    </div>
  );
}
