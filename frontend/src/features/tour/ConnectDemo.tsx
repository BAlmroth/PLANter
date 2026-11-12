import styles from "./ConnectDemo.module.css";

// The path the arrow (and the cursor) takes: from the dot on the right of "LoginForm"
// to the dot on the left of "Login", bending a little like a dragged line
const PATH = "M 100 46 C 128 16, 140 76, 168 46";
const LOOP = "2.8s"; // one drag, then a short pause before it starts again

// A small animation in a tour card: how to connect two items on the map by dragging.
// Built with SVG's own animation elements, so it needs no JavaScript and no library.
export function ConnectDemo() {
  // Read once per render. With "reduce motion" on, the finished arrow is shown without movement.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <svg
      className={styles.demo}
      viewBox="0 0 268 92"
      role="img"
      aria-label="Animation: dragging from the dot on the right of LoginForm to Login draws an arrow between them"
    >
      {/* The two items, like small map nodes */}
      <rect className={styles.node} x="8" y="30" width="92" height="32" rx="6" />
      <text className={styles.nodeText} x="54" y="50">
        LoginForm
      </text>
      <rect className={styles.node} x="168" y="30" width="92" height="32" rx="6" />
      <text className={styles.nodeText} x="214" y="50">
        Login
      </text>

      {/* The arrow. pathLength="1" makes its length 1, so the dash animation works for any shape:
          a dash of 1 hidden by an offset of 1 is invisible, offset 0 shows all of it. */}
      <path className={styles.line} d={PATH} pathLength={1} strokeDasharray="1" strokeDashoffset={reduceMotion ? 0 : 1}>
        {!reduceMotion && (
          <animate
            attributeName="stroke-dashoffset"
            values="1;0;0"
            keyTimes="0;0.6;1"
            dur={LOOP}
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* The dots where connections start (right) and end (left) */}
      <circle className={styles.handle} cx="100" cy="46" r="4" />
      <circle className={styles.handle} cx="168" cy="46" r="4" />

      {/* The cursor follows the path while the line is drawn, then waits at the end */}
      {!reduceMotion && (
        <g className={styles.cursor}>
          <path d="M 0 0 L 0 14 L 4 10 L 7 16 L 9 15 L 6 9 L 11 9 Z" />
          <animateMotion path={PATH} keyPoints="0;1;1" keyTimes="0;0.6;1" calcMode="linear" dur={LOOP} repeatCount="indefinite" />
        </g>
      )}
    </svg>
  );
}
