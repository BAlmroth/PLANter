import { PAGE_HELP, type PageKey } from "../help/pageHelp";
import { clearFlags, readFlag, writeFlag } from "../../lib/storage";
import type { Placement } from "./placeCard";

// One card in a tour. `target` is the data-tour attribute of the element to highlight
// (<nav data-tour="project-nav">), or null for a card in the middle of the screen.
// A step whose element is not on the page (for example no items yet) is skipped.
export type TourStep = {
  target: string | null;
  title: string;
  body: string;
  placement?: Placement;
};

// The first card of every tour: the page's intro text, in the middle of the screen
const introStep = (page: PageKey): TourStep => ({ target: null, title: PAGE_HELP[page].title, body: PAGE_HELP[page].intro });

export const TOURS: Record<PageKey, TourStep[]> = {
  overview: [
    introStep("overview"),
    {
      target: "project-nav",
      title: "The parts of your plan",
      body: "Switch between the pages of your project here. Each page shows a short tour the first time you open it.",
    },
    {
      target: "sidebar",
      title: "Everything you have planned",
      body: "All your items, sorted by category. Click one to open it. This list follows you on every page.",
      placement: "right",
    },
    {
      target: "progress",
      title: "How far you have come",
      body: "The share of your items that are done. It grows as you mark items as done.",
    },
    {
      target: "help-button",
      title: "Help is always here",
      body: "Show the tour for a page again, restart the tutorial, or read the guides.",
      placement: "top",
    },
    {
      target: "nav-items",
      title: "Next: add your items",
      body: "Open Items to add pages, components and everything else you plan to build.",
    },
  ],
  description: [introStep("description")],
  moodboard: [introStep("moodboard")],
  list: [introStep("list")],
  map: [introStep("map")],
  item: [introStep("item")],
  tasks: [introStep("tasks")],
  checklist: [introStep("checklist")],
};

// localStorage flags. All start with "tour:", so "Restart the tutorial" clears them in one go.
const OFF = "tour:off"; // "Skip tutorial": no tour starts by itself any more
const WELCOME = "tour:welcome"; // the welcome screen has been shown
const seenKey = (page: PageKey) => `tour:${page}`;

// The welcome screen comes once, before the first tour, unless the tutorial was skipped
export function shouldShowWelcome(): boolean {
  return !readFlag(OFF) && !readFlag(WELCOME);
}

export function markWelcomeSeen(): void {
  writeFlag(WELCOME, true);
}

// Should this page's tour start by itself? Not after "Skip tutorial", and only once per page.
export function shouldAutoStart(page: PageKey): boolean {
  return !readFlag(OFF) && !readFlag(seenKey(page));
}

export function markTourSeen(page: PageKey): void {
  writeFlag(seenKey(page), true);
}

export function skipAllTours(): void {
  writeFlag(OFF, true);
}

// Every tour starts again, as for a new user
export function resetTours(): void {
  clearFlags("tour:");
}
