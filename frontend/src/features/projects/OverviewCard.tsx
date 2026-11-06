import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./ProjectOverview.module.css";

type Props = {
  label: string; // the small caps label, for example "Project description"
  to?: string; // when given, a click anywhere on the card opens this page
  aside?: ReactNode; // shown on the right of the label
  className?: string;
  children: ReactNode;
};

// One white card on the overview page
export function OverviewCard({ label, to, aside, className, children }: Props) {
  return (
    <section className={`${styles.card} ${to ? styles.clickable : ""} ${className ?? ""}`}>
      <header className={styles.cardHeader}>
        <h2 className={styles.label}>
          {/* The link's ::after is stretched over the whole card (same idea as ProjectCard) */}
          {to ? (
            <Link to={to} className={styles.cardLink}>
              {label}
            </Link>
          ) : (
            label
          )}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
