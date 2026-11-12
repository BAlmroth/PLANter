// Short help text for every page of a project. Shown as the intro box at the top of the page
// and listed on the Help page. The texts are about the pages (UI), so they live in the frontend.
// Anything about item types or connections comes from the template instead.

export type PageKey = "overview" | "description" | "moodboard" | "list" | "map" | "tasks" | "checklist" | "item";

export type PageHelp = {
  title: string;
  // One or two plain sentences: what is this page and when do I use it?
  intro: string;
};

// The order here is the order on the Help page, which follows how a project is usually built
export const PAGE_HELP: Record<PageKey, PageHelp> = {
  overview: {
    title: "Overview",
    intro: "Your whole project at a glance. Each card is a shortcut: click it to open that part of the plan.",
  },
  description: {
    title: "Description",
    intro: "Describe the idea in a few sentences: what you are building, and for whom. The rest of the plan grows from this.",
  },
  moodboard: {
    title: "Moodboard",
    intro: "Collect how the project should look and feel: images, links, notes and a color palette. It does not count toward progress.",
  },
  list: {
    title: "Items",
    intro: "Everything you plan to build, sorted by category. Start with the pages, then add what each page needs. Click an item to open it.",
  },
  map: {
    title: "Map",
    intro: "The same items, drawn as a map. Arrows show how things connect. To connect two items, drag from the dot on the right side of one item to another item.",
  },
  item: {
    title: "Item",
    intro: "One thing in your plan. Set its status, mark it as MVP, connect it to other items, and add links, images and notes.",
  },
  tasks: {
    title: "Tasks & progress",
    intro: "At the top: how far the plan has come and what might be missing. Below: the concrete to-dos, which you can sort into sprints.",
  },
  checklist: {
    title: "Checklist",
    intro: "What should be in place before you start programming. Every ✗ links to where you can fix it.",
  },
};

// Which page a URL inside a project is, or null for a URL that has no help (for example a typo).
// `pathname` is the part after /projects/:projectId, `view` is the ?view= value on the items page.
export function pageKeyFromPath(pathname: string, view: string | null): PageKey | null {
  // "/projects/abc/items/123" -> ["items", "123"], "/projects/abc" -> []
  const parts = pathname.split("/").filter(Boolean).slice(2);
  const page = parts[0];

  if (page === undefined) return "overview";
  if (page === "plan") return view === "map" ? "map" : "list";
  if (page === "items") return "item";
  if (page === "description" || page === "moodboard" || page === "tasks" || page === "checklist") return page;
  return null;
}
