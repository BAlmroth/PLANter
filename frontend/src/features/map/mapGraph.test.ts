import { describe, expect, it } from "vitest";
import type { Item, Template } from "../items/types";
import type { Relationship } from "../relationships/types";
import { buildEdges, buildNodes, fadeNodes, FADED, HALF_FADED } from "./mapGraph";
import type { ItemNodeType } from "./types";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [
    { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", size: "large", description: "", example: "" },
    { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#B45309", description: "", example: "" },
  ],
  groupColors: [],
  relationshipTypes: [
    { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: false, description: "" },
    { key: "belongs_to", label: "belongs to", inverseLabel: "contains", allowCycles: false, readsBackward: true, description: "" },
  ],
  allowedCombinations: [],
};

const item = (id: string, type = "page"): Item => ({
  id,
  projectId: "p",
  type,
  title: `Item ${id}`,
  description: null,
  status: "planned",
  isMvp: false,
  positionX: 10,
  positionY: 20,
  imageUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
});
const relationship = (id: string, sourceItemId: string, targetItemId: string, type = "uses"): Relationship => ({
  id,
  projectId: "p",
  sourceItemId,
  targetItemId,
  type,
});
// The faded nodes are checked through their style, so the node only needs an id here
const node = (id: string) => ({ id, type: "item", position: { x: 0, y: 0 }, data: {} }) as unknown as ItemNodeType;
const opacityOf = (nodes: ItemNodeType[], id: string) => nodes.find((n) => n.id === id)!.style?.opacity;

describe("buildNodes", () => {
  it("reads label, color, size and position from the item and the template", () => {
    const [n] = buildNodes([item("a")], [], template, new Map(), "horizontal");
    expect(n.position).toEqual({ x: 10, y: 20 });
    expect(n.data).toMatchObject({ categoryLabel: "Page", color: "#2563A8", size: "large", vertical: false });
  });

  it("shows an unknown type as Unknown, and uses a medium card", () => {
    const [n] = buildNodes([item("a", "nope")], [], template, new Map(), "vertical");
    expect(n.data).toMatchObject({ categoryLabel: "Unknown", color: undefined, size: "medium", vertical: true });
  });

  it("does not crash before the template is loaded", () => {
    const [n] = buildNodes([item("a")], [], null, new Map(), "horizontal");
    expect(n.data.categoryLabel).toBe("Unknown");
  });
});

describe("buildEdges", () => {
  it("draws a connection from its source to its target, with the label", () => {
    const [e] = buildEdges([relationship("r1", "a", "b")], [item("a"), item("b")], template, null, null);
    expect(e).toMatchObject({ source: "a", target: "b", label: "uses", animated: false, style: undefined });
  });

  it("turns a type that reads backwards around, with the inverse label", () => {
    const [e] = buildEdges([relationship("r1", "comp", "page", "belongs_to")], [item("comp", "component"), item("page")], template, null, null);
    expect(e).toMatchObject({ source: "page", target: "comp", label: "contains" });
  });

  it("adds the amount to the label, also when the line is turned around", () => {
    const withAmount = { ...relationship("r1", "comp", "page", "belongs_to"), quantity: 20 };
    const [e] = buildEdges([withAmount], [item("comp", "component"), item("page")], template, null, null);
    expect(e).toMatchObject({ source: "page", target: "comp", label: "contains (20)" });
  });

  it("lights up the connections of the selected item in the color of the source type", () => {
    const edges = buildEdges(
      [relationship("r1", "a", "b"), relationship("r2", "c", "d")],
      [item("a"), item("b"), item("c"), item("d")],
      template,
      "a",
      null,
    );
    expect(edges[0]).toMatchObject({ animated: true, style: { stroke: "#2563A8", strokeWidth: 3 } });
    expect(edges[1]).toMatchObject({ animated: false, style: { opacity: FADED } });
  });

  it("with a filter, keeps a connection visible when one end matches", () => {
    const edges = buildEdges(
      [relationship("r1", "a", "b"), relationship("r2", "c", "d")],
      [item("a"), item("b"), item("c"), item("d")],
      template,
      null,
      new Set(["a"]),
    );
    expect(edges[0].style).toBeUndefined();
    expect(edges[1].style).toEqual({ opacity: FADED });
  });

  it("shows an unknown relationship type as Unknown", () => {
    const [e] = buildEdges([relationship("r1", "a", "b", "nope")], [item("a"), item("b")], template, null, null);
    expect(e.label).toBe("Unknown");
  });
});

describe("fadeNodes", () => {
  const nodes = [node("a"), node("b"), node("c")];
  const relationships = [relationship("r1", "a", "b")];

  it("fades nothing without a selection and without a filter", () => {
    expect(fadeNodes(nodes, relationships, null, null).every((n) => n.style === undefined)).toBe(true);
  });

  it("with a selection, fades the items that are not connected to it, never the selected one", () => {
    const shown = fadeNodes(nodes, relationships, "a", null);
    expect(opacityOf(shown, "a")).toBeUndefined();
    expect(opacityOf(shown, "b")).toBeUndefined();
    expect(opacityOf(shown, "c")).toBe(FADED);
  });

  it("with a filter, fades the items that do not match", () => {
    const shown = fadeNodes(nodes, relationships, null, new Set(["a"]));
    expect(opacityOf(shown, "a")).toBeUndefined();
    expect(opacityOf(shown, "b")).toBe(FADED);
  });

  it("with a filter and a selection, half fades a filtered out item that is connected to the selection", () => {
    const shown = fadeNodes(nodes, relationships, "a", new Set(["c"]));
    expect(opacityOf(shown, "a")).toBeUndefined(); // selected
    expect(opacityOf(shown, "b")).toBe(HALF_FADED); // filtered out, connected
    expect(opacityOf(shown, "c")).toBeUndefined(); // matches the filter
  });
});
