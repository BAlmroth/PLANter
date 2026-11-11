import { Fragment } from "react";
import { Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

// One step in the trail. A step without "to" is the page we are on.
export type Crumb = { label: string; to?: string };

type Props = { crumbs: Crumb[] };

// "Project / Items / Login": small text with slashes between. The last step is the current page.
export function Breadcrumb({ crumbs }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      {crumbs.map((crumb, index) => (
        <Fragment key={index}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {crumb.to ? (
            <Link to={crumb.to}>{crumb.label}</Link>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
