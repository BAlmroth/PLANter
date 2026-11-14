// The shape of a demo project, shared by every demo (demoPortfolio.ts for web, demoGame.ts for game).
// Plain data only (no database calls), so a test can check it against its template.
// Every item has a `ref`, a short name used to point at the item (for relationships, groups,
// tasks and so on). The runner (seedDemo.ts) turns refs into real ids.

export type Status = "planned" | "in_progress" | "done";

export type SeedItem = {
  ref: string;
  type: string; // a key from the demo's template
  title: string;
  description?: string;
  // Requirements that are not items ("Only in summer"), shown in the Requirements card
  conditions?: string;
  status: Status;
  isMvp?: boolean;
  // Where the item sits on the map, in grid steps (the runner multiplies by DEMO_COLUMN_WIDTH and
  // DEMO_ROW_HEIGHT). Hand placed: columns by role, rows by feature, so related items sit side by side.
  col: number;
  row: number;
  details?: { title: string; url?: string; text?: string }[];
};

export type SeedTask = { title: string; item?: string; done: boolean };

export type DemoData = {
  project: { name: string; template: string; description: string };
  items: SeedItem[];
  // quantity: an amount, only on relationship types with hasQuantity ("made from 20 Wood")
  relationships: { source: string; type: string; target: string; quantity?: number }[];
  groups: { name: string; description?: string; items: string[] }[];
  sprints: { name: string; tasks: SeedTask[] }[];
  backlogTasks: SeedTask[];
  inspirations: { title: string; url?: string; text?: string }[];
};

// Map spacing for the demos, in pixels per grid step. Much wider than the spacing for new items
// (services/itemLayout.ts), so the arrows between items are easy to follow.
export const DEMO_COLUMN_WIDTH = 420;
export const DEMO_ROW_HEIGHT = 220;
