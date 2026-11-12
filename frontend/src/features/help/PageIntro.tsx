import { useState } from "react";
import { Link } from "react-router-dom";
import { readFlag, writeFlag } from "../../lib/storage";
import { PAGE_HELP, type PageKey } from "./pageHelp";
import styles from "./PageIntro.module.css";

type Props = { page: PageKey };

// "What is this page?" box at the top of a project page. Open until the user clicks "Got it",
// then it shrinks to a small "About this page" button that opens it again.
export function PageIntro({ page }: Props) {
  // The flag is read on every render, so moving to another page shows that page's own state.
  // This state only exists to make React render again after the flag changes.
  const [, setVersion] = useState(0);
  const flagKey = `intro:${page}`;
  const hidden = readFlag(flagKey);
  const help = PAGE_HELP[page];

  function setHidden(value: boolean) {
    writeFlag(flagKey, value);
    setVersion((v) => v + 1);
  }

  if (hidden) {
    return (
      <div className={styles.collapsed}>
        <button type="button" className={styles.reopen} onClick={() => setHidden(false)}>
          ⓘ About this page
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.intro} aria-label={`About ${help.title}`}>
      <p className={styles.text}>
        <strong>{help.title}:</strong> {help.intro}
      </p>
      <div className={styles.actions}>
        <Link to="/help">More help</Link>
        <button type="button" onClick={() => setHidden(true)}>
          Got it
        </button>
      </div>
    </aside>
  );
}
