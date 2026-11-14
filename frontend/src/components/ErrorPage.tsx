import { Link } from "react-router-dom";
import { ERROR_CONTENT, type ErrorKind } from "./errorContent";
import styles from "./ErrorPage.module.css";

type Props = {
  kind: ErrorKind;
  // Shows a "Try again" button (or "Reload page" for a crash) when given
  onRetry?: () => void;
  // Where the link goes. Default: the project list
  backTo?: { to: string; label: string };
  // Extra text from the API (the error message). Not shown for 404, where it adds nothing.
  detail?: string;
  // true inside the project frame, which already has a <main> and an <h1> (the project name)
  inFrame?: boolean;
};

// One error page for the whole app: 404, 500, no connection and crashes.
// The text for each kind lives in errorContent.ts.
export function ErrorPage({ kind, onRetry, backTo = { to: "/", label: "Back to projects" }, detail, inFrame }: Props) {
  const content = ERROR_CONTENT[kind];
  // A page has only one <main>, and its own <h1> only when it is a page of its own
  const Wrapper = inFrame ? "div" : "main";
  const Heading = inFrame ? "h2" : "h1";

  return (
    <Wrapper className={styles.page}>
      {/* role="alert": a screen reader reads the error out when the page appears */}
      <div className={styles.card} role="alert">
        {content.code && <p className={styles.code}>{content.code}</p>}
        <Heading className={styles.title}>{content.title}</Heading>
        <p>{content.message}</p>
        {detail && kind !== "notFound" && <p className={styles.detail}>{detail}</p>}

        <div className={styles.actions}>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              {kind === "crash" ? "Reload page" : "Try again"}
            </button>
          )}
          <Link to={backTo.to} className={styles.back}>
            {backTo.label}
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
