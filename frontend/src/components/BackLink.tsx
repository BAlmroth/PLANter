import { useNavigate } from "react-router-dom";
import styles from "./BackLink.module.css";

// "← Back": one step back in the browser history, like the browser's own back button.
// BrowserRouter stores the position in history.state.idx. At 0 the page was opened directly
// (a bookmark, a new tab), so there is nothing to go back to and we go to the projects list instead.
export function BackLink() {
  const navigate = useNavigate();

  function goBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  }

  return (
    <button type="button" className={styles.back} onClick={goBack}>
      ← Back
    </button>
  );
}
