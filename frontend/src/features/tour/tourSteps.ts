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
  // A small animation in the card, for things that are easier to show than to tell
  demo?: "connect";
};

// The first card of every tour: the page's intro text, in the middle of the screen
const introStep = (page: PageKey): TourStep => ({ target: null, title: PAGE_HELP[page].title, body: PAGE_HELP[page].intro });

export const TOURS: Record<PageKey, TourStep[]> = {
  overview: [
    // New users land here after creating a project, so this card is the welcome to the whole tutorial
    {
      target: null,
      title: "Welcome to PLANter!",
      body: "This is your project's overview: the whole plan at a glance. Let's look around. It takes about a minute, and you can skip it any time.",
    },
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
  // A simple page with one card: the intro is enough
  description: [introStep("description")],
  moodboard: [
    introStep("moodboard"),
    {
      target: "moodboard-card",
      title: "Moodboard",
      body: "Images, links and notes about the look and feel. Your color palette lives here too. Use the edit button next to the heading to add something.",
    },
    {
      target: "inspiration-card",
      title: "Inspiration",
      body: "Sites and apps you like. Add a note on what you like about them, so you remember why.",
    },
  ],
  list: [
    introStep("list"),
    {
      target: "add-item",
      title: "Add an item",
      body: "Pick a category and give it a name. Start with the pages of your site, then add what each page needs.",
    },
    {
      target: "plan-view-toggle",
      title: "List or map",
      body: "The same items in two views. Switch to Map to see how everything is connected.",
    },
    {
      target: "file-modes",
      title: "Category or group",
      body: "Sort the list by category, or by your own groups, like everything for the checkout.",
    },
    {
      target: "file-sections",
      title: "Your items",
      body: "Click an item to open it and add details, connections and tasks. The bar on each heading shows how much is done.",
      placement: "top",
    },
  ],
  map: [
    introStep("map"),
    {
      target: "map-toolbar",
      title: "Add and filter",
      body: "Add items straight on the map, and filter what you see by category, status or group.",
      placement: "right",
    },
    {
      target: null,
      title: "Connect two items",
      body: "Drag from the dot on the right side of an item to another item. Then pick what kind of connection it is.",
      demo: "connect",
    },
    {
      target: "map-legend",
      title: "What the colors mean",
      body: "Each color is a category. A dashed border means the item is still planned.",
      placement: "left",
    },
    {
      target: null,
      title: "Click and double-click",
      body: "Click an item to light up everything it is connected to. Double-click it to open it.",
    },
  ],
  item: [
    introStep("item"),
    {
      target: "item-status",
      title: "Status",
      body: "Tick In progress or Done as you work. Done items count toward the progress.",
    },
    {
      target: "item-edit",
      title: "Edit and MVP",
      body: "Change the name, category or description. Mark the item as MVP if it belongs in the first version you build.",
    },
    {
      target: "item-connections",
      title: "Connections",
      body: "What this item is connected to, read as a sentence. Add a new connected item here, or connect one you already have.",
    },
    {
      target: "item-tasks",
      title: "Tasks",
      body: "The concrete to-dos for this item. They also show up on Tasks & progress.",
    },
  ],
  tasks: [
    introStep("tasks"),
    {
      target: "tasks-progress",
      title: "Progress",
      body: "How many items are done, in total and per category.",
    },
    {
      target: "yet-to-plan",
      title: "Yet to plan",
      body: "Categories most projects need that your plan does not have yet, like tests or security.",
    },
    {
      target: "item-warnings",
      title: "Warnings",
      body: "Items that are probably missing something, like a page with no components. Click one to fix it.",
    },
    {
      target: "tasks-section",
      title: "Tasks & sprints",
      body: "Write down the concrete to-dos, link them to items, and sort them into sprints.",
      placement: "top",
    },
  ],
  checklist: [
    introStep("checklist"),
    {
      target: "checklist-checks",
      title: "Before you start",
      body: "Every check, with ✓ when it is done and ✗ when it is not. Click a ✗ to go where you fix it.",
    },
    {
      target: "checklist-warnings",
      title: "All warnings",
      body: "Every item that is probably missing something. Tasks & progress only shows the first few.",
      placement: "top",
    },
  ],
};

// localStorage flags. All start with "tour:", so "Restart the tutorial" clears them in one go.
const OFF = "tour:off"; // "Skip tutorial": no tour starts by itself any more
const seenKey = (page: PageKey) => `tour:${page}`;

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
