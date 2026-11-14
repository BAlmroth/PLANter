import type { ReactNode } from "react";
import { Loader } from "./Loader";
import { GateContext, type Gate } from "./useLoadGate";
import styles from "./LoadGate.module.css";

type Props = {
  gate: Gate;
  pending: boolean;
  label?: string;
  instant?: boolean; // no fade-in delay: use when another loader was just shown, so there is no gap
  children: ReactNode;
};

// Mounts its children right away (so they can fetch), but keeps them invisible and shows one
// loader on top until `pending` is false. Then everything appears at the same time.
export function LoadGate({
  gate,
  pending,
  label = "Loading…",
  instant,
  children,
}: Props) {
  return (
    <GateContext value={gate}>
      <div className={pending ? styles.pending : styles.ready}>
        {pending && (
          <div className={styles.cover}>
            <Loader label={label} size="page" instant={instant} />
          </div>
        )}
        {/* inert: no focus or clicks and hidden from screen readers while it is not shown */}
        <div
          className={styles.content}
          inert={pending}
          style={pending ? { visibility: "hidden" } : undefined}
        >
          {children}
        </div>
      </div>
    </GateContext>
  );
}
