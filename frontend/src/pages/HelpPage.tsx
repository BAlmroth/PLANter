import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BackLink } from "../components/BackLink";
import { Breadcrumb } from "../components/Breadcrumb";
import { ViewToggle } from "../components/ViewToggle";
import { PAGE_HELP } from "../features/help/pageHelp";
import { GLOSSARY } from "../features/help/glossary";
import { TypeBadge } from "../features/items/TypeBadge";
import { useTemplate } from "../features/items/useTemplate";
import { useTemplateList } from "../features/items/useTemplateList";
import { resetTours } from "../features/tour/tourSteps";
import styles from "./HelpPage.module.css";
import { Loader } from "../components/Loader";

// Shown when the URL has no ?template= (the footer link is outside any project)
const DEFAULT_TEMPLATE = "web";

// The help and docs page (/help), reachable from the footer, project settings and the ? button.
// Page texts come from pageHelp.ts, everything about categories and connections from the template.
// The template is in the URL (/help?template=game, see helpPath), so links from a project open its own
// categories, and a switch lets the user look at the other templates.
export function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const templateKey = searchParams.get("template") ?? DEFAULT_TEMPLATE;
  const { template, error, loading, refetch } = useTemplate(templateKey);
  const templateChoices = useTemplateList();
  const [toursReset, setToursReset] = useState(false);

  // replace: switching templates should not fill the browser's Back history
  function chooseTemplate(key: string) {
    setSearchParams({ template: key }, { replace: true });
  }

  const typeLabel = (key: string) => template?.itemTypes.find((t) => t.key === key)?.label ?? "Unknown";

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <BackLink />
        <Breadcrumb crumbs={[{ label: "Projects", to: "/" }, { label: "Help" }]} />
      </div>
      <h1>Help</h1>

      <section className={styles.card} aria-labelledby="how-it-works">
        <h2 id="how-it-works">How PLANter works</h2>
        <p>PLANter helps you see the whole project before you write any code. A plan is built in four steps:</p>
        <ol className={styles.steps}>
          <li>
            <strong>Describe the idea</strong> in a few sentences: what are you building, and for whom?
          </li>
          <li>
            <strong>Add items:</strong> everything you plan to build, sorted into categories. The categories come
            from the project's template (for example a website or a game) and are listed below.
          </li>
          <li>
            <strong>Connect them:</strong> what is part of what, what uses what, what leads where. This is how you
            spot what is missing.
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

      <section className={styles.card} aria-labelledby="words">
        <h2 id="words">Words</h2>
        <dl className={styles.list}>
          {GLOSSARY.map((entry) => (
            <div key={entry.word}>
              <dt>{entry.word}</dt>
              <dd>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Only when there is a real choice. The chosen template stays in the URL */}
      {templateChoices.length > 1 && (
        <div className={styles.templateSwitch}>
          <span>Categories and connections for:</span>
          <ViewToggle
            label="Template"
            options={templateChoices.map((t) => ({ value: t.key, label: t.label }))}
            value={templateKey}
            onChange={chooseTemplate}
          />
        </div>
      )}

      {loading && <Loader label="Loading categories and connections…" size="section" />}
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
              A connection has a direction and reads as a sentence, like “Kitchen part of Castle”. The other item
              shows it the other way around: “Castle contains Kitchen”.
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

      <section className={styles.card} aria-labelledby="tutorial">
        <h2 id="tutorial">Tutorial</h2>
        <p>
          Every page has a short tour the first time you open it. To see one page's tour again, use the ? button in
          the bottom-right corner of a project. To start over as a new user:
        </p>
        <p>
          <button
            type="button"
            onClick={() => {
              resetTours();
              setToursReset(true);
            }}
          >
            Restart the tutorial
          </button>{" "}
          {/* role="status": a screen reader reads the confirmation out loud */}
          <span role="status">{toursReset && "Done. The tour starts again on every page."}</span>
        </p>
      </section>

      <p>
        <Link to="/">Back to projects</Link>
      </p>
    </main>
  );
}
