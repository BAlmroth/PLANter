import { useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_HELP } from "../features/help/pageHelp";
import { TypeBadge } from "../features/items/TypeBadge";
import { useTemplate } from "../features/items/useTemplate";
import { clearFlags } from "../lib/storage";
import styles from "./HelpPage.module.css";

// The help page outside any project. "web" is the only template; when the game template
// exists, this page can take the template from the project it was opened from.
const TEMPLATE_KEY = "web";

// The help and docs page (/help), reachable from the footer, project settings and every intro box.
// Page texts come from pageHelp.ts, everything about categories and connections from the template.
export function HelpPage() {
  const { template, error, loading, refetch } = useTemplate(TEMPLATE_KEY);
  const [introsReset, setIntrosReset] = useState(false);

  const typeLabel = (key: string) => template?.itemTypes.find((t) => t.key === key)?.label ?? "Unknown";

  return (
    <main className={styles.page}>
      <h1>Help</h1>

      <section className={styles.card} aria-labelledby="how-it-works">
        <h2 id="how-it-works">How PLANter works</h2>
        <p>PLANter helps you see the whole project before you write any code. A plan is built in four steps:</p>
        <ol className={styles.steps}>
          <li>
            <strong>Describe the idea</strong> in a few sentences: what are you building, and for whom?
          </li>
          <li>
            <strong>Add items:</strong> everything you plan to build, sorted into categories. Start with the pages.
          </li>
          <li>
            <strong>Connect them:</strong> which components are part of which page, what a button triggers, what
            data a function reads. This is how you spot what is missing.
          </li>
          <li>
            <strong>Plan the work:</strong> turn items into tasks, sort them into sprints, and follow the progress.
          </li>
        </ol>
      </section>

      <section className={styles.card} aria-labelledby="pages">
        <h2 id="pages">The pages of a project</h2>
        <dl className={styles.list}>
          {Object.entries(PAGE_HELP).map(([key, help]) => (
            <div key={key}>
              <dt>{help.title}</dt>
              <dd>{help.intro}</dd>
            </div>
          ))}
        </dl>
      </section>

      {loading && <p>Loading categories and connections…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {template && (
        <>
          <section className={styles.card} aria-labelledby="categories">
            <h2 id="categories">Categories</h2>
            <p>Every item has a category. It decides the item's color and what it can be connected to.</p>
            <dl className={styles.list}>
              {template.itemTypes.map((type) => (
                <div key={type.key}>
                  <dt>
                    <TypeBadge typeKey={type.key} template={template} />
                  </dt>
                  <dd>
                    {type.description} <span className={styles.example}>For example: {type.example}.</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="connections">
            <h2 id="connections">Connections</h2>
            <p>
              A connection has a direction and reads as a sentence, like “LoginForm part of Login”. The other item
              shows it the other way around: “Login contains LoginForm”.
            </p>
            <dl className={styles.list}>
              {template.relationshipTypes.map((rel) => {
                // Which categories this connection can go between, for example "Component → Page"
                const combos = template.allowedCombinations.filter((c) => c.relationship === rel.key);
                return (
                  <div key={rel.key}>
                    <dt>
                      {rel.label} <span className={styles.inverse}>/ {rel.inverseLabel}</span>
                    </dt>
                    <dd>
                      {rel.description}
                      <span className={styles.combos}>
                        {combos.map((c) => `${typeLabel(c.source)} → ${typeLabel(c.target)}`).join(", ")}
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </>
      )}

      <section className={styles.card} aria-labelledby="intros">
        <h2 id="intros">Page intros</h2>
        <p>Closed the “About this page” boxes? Show them on every page again.</p>
        <p>
          <button
            type="button"
            onClick={() => {
              clearFlags("intro:");
              setIntrosReset(true);
            }}
          >
            Show all page intros again
          </button>{" "}
          {/* role="status": a screen reader reads the confirmation out loud */}
          <span role="status">{introsReset && "Done. They show again on every page."}</span>
        </p>
      </section>

      <p>
        <Link to="/">Back to projects</Link>
      </p>
    </main>
  );
}
