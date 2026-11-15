import { Link } from "react-router-dom";
import { InfoBubble } from "../../components/InfoBubble";
import { linkForCheck } from "./checkLinks";
import type { Check } from "./types";
import styles from "./CheckList.module.css";

type Props = {
  title: string;
  checks: Check[];
};

// One group of checks with ✓ or ✗ in front of each, a small "i" with what the check is about,
// and a link to where a failed one is fixed.
export function CheckList({ title, checks }: Props) {
  const passed = checks.filter((check) => check.passed).length;
  // What is left to do comes first. filter keeps the backend's order inside each part.
  const sorted = [...checks.filter((check) => !check.passed), ...checks.filter((check) => check.passed)];

  return (
    <section className={styles.group}>
      <h3 className={styles.title}>
        {title}
        <span className={styles.count}>
          {passed} / {checks.length}
        </span>
      </h3>

      <ul className={styles.list}>
        {sorted.map((check) => {
          const link = check.passed ? null : linkForCheck(check);
          return (
            <li key={check.key} className={check.passed ? styles.passed : styles.failed}>
              {/* The mark is decoration for sighted users. Screen readers get "Done" or "Not done" as text. */}
              <span className={styles.mark} aria-hidden="true">
                {check.passed ? "✓" : "✗"}
              </span>
              <span className={styles.label}>
                <span className={styles.visuallyHidden}>{check.passed ? "Done:" : "Not done:"}</span>
                {check.label}
              </span>
              {/* A link further down this page is a plain <a href="#id">: the browser scrolls to it by itself.
                  A link to another page goes through the router (<Link>), so the app does not reload. */}
              {link &&
                (link.samePage ? (
                  <a href={link.to} className={styles.link}>
                    {link.label}
                  </a>
                ) : (
                  <Link to={link.to} className={styles.link}>
                    {link.label}
                  </Link>
                ))}
              {/* Always in the last column, so every "i" lines up no matter how long the label is */}
              {check.description && (
                <span className={styles.help}>
                  <InfoBubble text={check.description} label={`About ${check.label}`} size="small" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
