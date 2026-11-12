import { describe, expect, it } from "vitest";
import { TOURS } from "./tourSteps";

// A step whose element does not exist is skipped without a sound, so a typo in a target name
// ("add-iten") would never be noticed in the browser. This test reads the source code instead.

// Every .tsx file under src/, as text. import.meta.glob is Vite's way to load files
// (no Node APIs needed): ?raw gives the file's text, eager loads them right away.
const files = import.meta.glob("../../**/*.tsx", { query: "?raw", import: "default", eager: true });
const source = Object.values(files).join("\n");

const targets = Object.values(TOURS).flatMap((steps) => steps.flatMap((step) => (step.target ? [step.target] : [])));

describe("tour targets", () => {
  it("found the source files", () => {
    expect(Object.keys(files).length).toBeGreaterThan(10);
  });

  it("are plain names, safe to put in a CSS selector", () => {
    for (const target of targets) expect(target).toMatch(/^[a-z][a-z-]*$/);
  });

  it("all exist in the code, as data-tour or as a MoodboardCard tourId", () => {
    for (const target of targets) {
      const used = source.includes(`data-tour="${target}"`) || source.includes(`tourId="${target}"`);
      expect(used, `nothing has data-tour="${target}"`).toBe(true);
    }
  });
});
