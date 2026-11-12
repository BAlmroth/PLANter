import type { ReactNode } from "react";
import styles from "./AuthForm.module.css";
import { AuthHero } from "./AuthHero";

// Shared page shell for every logged-out page: the hero on the left and a
// card with the page's content on the right.
export function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <AuthHero />
      <div className={styles.formSide}>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
