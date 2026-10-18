import type { Edge, Node } from "@xyflow/react";

export type ItemStatus = "planned" | "in_progress" | "done";

// What one item node carries. React Flow requires `data` to be a plain object type.
export type ItemNodeData = {
  title: string;
  category: string; // template key, for example "page"
  status: ItemStatus;
};

// `Node<Data, "item">`: a node whose `type` is "item" and whose `data` has the shape above.
export type ItemNodeType = Node<ItemNodeData, "item">;

// Prototype only. Later the labels come from GET /api/templates/:key, never from the frontend.
export const CATEGORY_LABELS: Record<string, string> = {
  page: "Page",
  component: "Component",
  function: "Function",
  data: "Data",
  authentication: "Authentication",
  testing: "Testing",
};

// `position` is where the node sits on the canvas (x to the right, y downwards).
export const mockNodes: ItemNodeType[] = [
  { id: "1", type: "item", position: { x: 250, y: 0 }, data: { title: "LoginPage", category: "page", status: "in_progress" } },
  { id: "2", type: "item", position: { x: 250, y: 150 }, data: { title: "LoginForm", category: "component", status: "planned" } },
  { id: "3", type: "item", position: { x: 250, y: 300 }, data: { title: "submitLogin", category: "function", status: "planned" } },
  { id: "4", type: "item", position: { x: 0, y: 450 }, data: { title: "users", category: "data", status: "done" } },
  { id: "5", type: "item", position: { x: 500, y: 450 }, data: { title: "Supabase Auth", category: "authentication", status: "done" } },
  { id: "6", type: "item", position: { x: 600, y: 150 }, data: { title: "Login tests", category: "testing", status: "planned" } },
];

// An edge goes from `source` node id to `target` node id. `label` is drawn on the line.
export const mockEdges: Edge[] = [
  { id: "e2-1", source: "2", target: "1", label: "belongs to" },
  { id: "e2-3", source: "2", target: "3", label: "triggers" },
  { id: "e3-4", source: "3", target: "4", label: "uses" },
  { id: "e3-5", source: "3", target: "5", label: "uses" },
  { id: "e6-3", source: "6", target: "3", label: "depends on" },
];
