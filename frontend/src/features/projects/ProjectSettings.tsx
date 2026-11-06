import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api";
import { deleteProject } from "./projectsApi";
import type { Project } from "./types";
import styles from "./ProjectSettings.module.css";

type Props = { project: Project };

// Which part of the menu is showing. Deleting needs two clicks: "ask" first, then "confirm".
type Step = "closed" | "menu" | "confirm";

// A settings (gear) button in the sub header. For now its only action is deleting the project,
// which has to be confirmed twice because it cannot be undone.
export function ProjectSettings({ project }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("closed");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setStep("closed");
    setError(null);
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.gear}
        aria-label="Project settings"
        aria-expanded={step !== "closed"}
        onClick={() => (step === "closed" ? setStep("menu") : close())}
      >
        ⚙
      </button>

      {step !== "closed" && (
        <div className={styles.panel} role="dialog" aria-label="Project settings">
          {step === "menu" && (
            <button type="button" className={styles.danger} onClick={() => setStep("confirm")}>
              Delete project…
            </button>
          )}

          {step === "confirm" && (
            <>
              {/* project.name is rendered as text only, React escapes it */}
              <p className={styles.warning}>
                Delete <strong>{project.name}</strong> and everything in it (items, connections,
                tasks, images)? This cannot be undone.
              </p>
              <div className={styles.buttons}>
                <button type="button" onClick={close} disabled={deleting}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Yes, delete forever"}
                </button>
              </div>
            </>
          )}

          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
