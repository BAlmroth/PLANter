import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { Footer } from "./Footer";
import { Header } from "./Header";
import styles from "./AppLayout.module.css";

//header and footer wrapper for all logged in pages
export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className={styles.layout}>
      <Header />

      <div className={styles.content}>
        {/* A crash in a page shows the error page here, with the header and footer still there.
            resetKey: going to another page clears the error. */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  );
}
