import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import styles from "./AppLayout.module.css";

//header and footer wrapper for all logged in pages
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />

      <div className={styles.content}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
