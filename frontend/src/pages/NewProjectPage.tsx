import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useTemplate } from "../features/items/useTemplate";
import { createProject } from "../features/projects/projectsApi";
import { StarterForm } from "../features/projects/StarterForm";
import { EMPTY_STARTER, starterSummary, toCreateInput, type Starter } from "../features/projects/starter";
import styles from "./NewProjectPage.module.css";

// There is only one template for now (the game template is a Could) so there is no dropdown.
// When a second template exists: add GET /api/templates (a list) and a select
const DEFAULT_TEMPLATE = "web";

type Step = "basics" | "starter";

// Creating a project in two steps:
// 1. name and description, with "Create empty project" for a quick start
// 2. optional: "Already got a good idea?", items per category, groups and first tasks
// Both steps keep their values when the user goes back and forth. Everything is sent in one request.
export function NewProjectPage() {
  const navigate = useNavigate();
  const { template, error: templateError, refetch } = useTemplate(DEFAULT_TEMPLATE);

  const [step, setStep] = useState<Step>("basics");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [starter, setStarter] = useState<Starter>(EMPTY_STARTER);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The name is the only required field, checked before both "Next" and "Create"
  function nameIsMissing() {
    if (name.trim() !== "") return false;
    setError("Give the project a name.");
    setStep("basics");
    return true;
  }

  async function create(withStarter: boolean) {
    if (nameIsMissing()) return;
    setError(null);
    setSubmitting(true);
    try {
      const basics = { name, description, template: DEFAULT_TEMPLATE };
      const project = await createProject(toCreateInput(basics, withStarter ? starter : EMPTY_STARTER, template));
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  function goToStarter(e: FormEvent) {
    // Enter in the name field also lands here, so Enter means "Next", not "create empty"
    e.preventDefault();
    if (nameIsMissing()) return;
    setError(null);
    setStep("starter");
  }

  if (step === "basics") {
    return (
      <main className={styles.page}>
        <p className={styles.stepLabel}>Step 1 of 2</p>
        <h1 className={styles.title}>New project</h1>
        <p className={styles.lead}>What are you building? A name is enough to start.</p>

        <form onSubmit={goToStarter} className={styles.form}>
          <label>
            Name
            <input type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Description (optional)
            <textarea
              maxLength={500}
              rows={3}
              placeholder="What is it, and who is it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => create(false)} disabled={submitting}>
              {submitting ? "Creating…" : "Create empty project"}
            </button>
            <button type="submit" disabled={submitting}>
              Next: add what you already know →
            </button>
          </div>
        </form>

        <p>
          <Link to="/">Back to projects</Link>
        </p>
      </main>
    );
  }

  const summary = template ? starterSummary(starter, template) : null;

  return (
    <main className={styles.page}>
      <p className={styles.stepLabel}>Step 2 of 2</p>
      <h1 className={styles.title}>Already got a good idea?</h1>
      <p className={styles.lead}>
        Add the things you already know about <strong>{name}</strong>. Everything here is optional, and you can
        add, change or remove it later.
      </p>

      {templateError ? (
        <div role="alert">
          <p>{templateError}</p>
          <button type="button" onClick={refetch}>
            Try again
          </button>
        </div>
      ) : template ? (
        <StarterForm template={template} starter={starter} setStarter={setStarter} />
      ) : (
        <p>Loading categories…</p>
      )}

      {/* Stays at the bottom of the screen, so "Create project" is always in reach in a long list */}
      <div className={styles.footer}>
        {/* role="status": a screen reader reads the summary when it changes */}
        <p role="status" className={styles.summary}>
          {summary ? `You're adding ${summary}.` : "Nothing added yet. That's fine too."}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep("basics")} disabled={submitting}>
            ← Back
          </button>
          <button type="button" onClick={() => create(true)} disabled={submitting || !template}>
            {submitting ? "Creating…" : "Create project"}
          </button>
        </div>
      </div>
    </main>
  );
}
