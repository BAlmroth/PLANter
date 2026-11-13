import { useConfirm } from "../../components/useConfirm";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, ConnectionMode, Controls, MarkerType, MiniMap, Panel, ReactFlow, useNodesState, type Connection, type Edge, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { ItemForm } from "../items/ItemForm";
import { createItem, updateItem } from "../items/itemsApi";
import { getTypeColor } from "../items/typeColor";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { getAllowedRelationshipTypes } from "../relationships/connections";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import type { WarningsByItem } from "../warnings/types";
import { ConnectionPrompt } from "./ConnectionPrompt";
import { ItemFilterBar } from "../filters/ItemFilterBar";
import { hasFilters, matchesFilters, NO_FILTERS, type ItemFilters } from "../filters/itemFilters";
import { ItemNode } from "./ItemNode";
import { getCardSize } from "./cardSize";
import { tidyLayout, type LayoutDirection } from "./tidyLayout";
import { readFlag, writeFlag } from "../../lib/storage";
import { MapLegend } from "./MapLegend";
import type { ItemNodeType } from "./types";
import styles from "./MapView.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// How faded the items and connections are that are not in focus (filtered out, or not connected to the selection)
const FADED = 0.2;
// The "half state": an item connected to the selected item, but filtered out
const HALF_FADED = 0.6;

// The relationship map: items as nodes, relationships as arrows.
// Click a node to open the item's detail view. Drag a node to move it: the new position is saved
// when the drag ends. Drag from one node's right dot to another's left dot to connect them.
// Click a connection to delete it. The "Add item" button creates an item.
export function MapView({ project, warnings }: { project: Project; warnings: WarningsByItem }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const groups = useGroups(project.id);
  // Shown above the map when saving a position or deleting a connection fails
  const [saveError, setSaveError] = useState<string | null>(null);
  // true while the add item form is open
  const { confirm, modal } = useConfirm();
  // The React Flow instance, saved in onInit, to call fitView after "Tidy up"
  const flowRef = useRef<ReactFlowInstance<ItemNodeType, Edge> | null>(null);
  // Which way the map flows. A view preference, kept in this browser only (lib/storage.ts).
  const [direction, setDirection] = useState<LayoutDirection>(() => (readFlag("map:vertical") ? "vertical" : "horizontal"));
  // true: the map covers the whole window (CSS only, not the browser's fullscreen mode)
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  // true while the "Manage" panel (Tidy up and the map direction) is open
  const [managing, setManaging] = useState(false);
  // true while the filter panel is open
  const [filtering, setFiltering] = useState(false);
  // The connection that was clicked, which offers a delete button
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // The two item ids of an arrow that was just dragged, while the user picks a relationship type
  const [pending, setPending] = useState<{ sourceId: string; targetId: string } | null>(null);
  // The node that was clicked: it and its connections light up (impact view)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Items that do not match the filters fade, so the matching ones stand out
  const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS);

  // How many filters are on, shown on the Filter button so you can see it with the panel closed
  const activeFilterCount =
    filters.types.length + filters.groupIds.length + filters.statuses.length + (filters.mvpOnly ? 1 : 0);

  const loading = template.loading || items.loading || relationships.loading || groups.loading;
  useGateLoading(loading);
  const error = template.error ?? items.error ?? relationships.error ?? groups.error;

  // Rebuilt only when the data changes, not on every render
  const itemNodes = useMemo(() => {
    const itemTypes = template.template?.itemTypes ?? [];

    return items.items.map((item): ItemNodeType => {
      return {
        id: item.id,
        type: "item",
        // The backend gives every new item a start position (services/itemLayout.ts),
        // so (0, 0) is a real position: the first row of the first column.
        position: { x: item.positionX, y: item.positionY },
        data: {
          title: item.title,
          category: item.type,
          // An unknown key is shown as "Unknown" instead of crashing (see CLAUDE.md)
          categoryLabel: itemTypes.find((type) => type.key === item.type)?.label ?? "Unknown",
          color: itemTypes.find((type) => type.key === item.type)?.color,
          status: item.status,
          groups: getGroupsOfItem(item.id, groups.groups).map(({ id, name, color }) => ({ id, name, color })),
          warnings: (warnings.get(item.id) ?? []).map((warning) => warning.message),
          size: template.template ? getCardSize(template.template, item.type) : "medium",
          vertical: direction === "vertical",
        },
      };
    });
  }, [template.template, items.items, groups.groups, warnings, direction]);

  // The ids of the items that match the filters, or null when no filter is set (nothing fades)
  const matchingIds = useMemo(() => {
    if (!hasFilters(filters)) return null;
    return new Set(items.items.filter((item) => matchesFilters(item, filters, groups.groups)).map((item) => item.id));
  }, [items.items, groups.groups, filters]);

  const edges = useMemo(() => {
    // Item id -> item, to find the type (and so the color) of an edge's source item
    const itemsById = new Map(items.items.map((item) => [item.id, item]));

    return relationships.relationships.map((relationship): Edge => {
      // Impact view: with a node selected, its own connections light up and the rest fade
      const touchesSelected =
        relationship.sourceItemId === selectedNodeId || relationship.targetItemId === selectedNodeId;
      // With a filter, a connection stays visible when at least one end matches,
      // so you can see what the matching items are connected to
      const touchesMatch =
        !matchingIds || matchingIds.has(relationship.sourceItemId) || matchingIds.has(relationship.targetItemId);
      // A type that reads backwards ("component belongs_to page") is drawn the other way round:
      // the line starts at the page and points to the component, with the reverse wording ("contains").
      // Only the drawing is turned. The saved connection keeps its direction.
      const relType = template.template?.relationshipTypes.find((type) => type.key === relationship.type);
      const drawnBackward = relType?.readsBackward === true;
      const fromId = drawnBackward ? relationship.targetItemId : relationship.sourceItemId;
      const toId = drawnBackward ? relationship.sourceItemId : relationship.targetItemId;
      const source = itemsById.get(fromId);
      const sourceColor = template.template && source ? getTypeColor(template.template, source.type) : undefined;
      return {
        id: relationship.id,
        source: fromId,
        target: toId,
        // "smoothstep" draws straight lines with 90 degree bends and rounded corners
        type: "smoothstep",
        // An arrowhead at the target end, so you can see which way the connection goes
        markerEnd: { type: MarkerType.ArrowClosed },
        // The item the line starts at shows its wording: "uses" from the source's side, "contains" from the target's
        label: relType ? (drawnBackward ? relType.inverseLabel : relType.label) : "Unknown",
        animated: touchesSelected,
        // A lit-up connection takes the color of its source item's type ("page uses design": page blue).
        // Unknown types fall back to the brand color.
        // With a filter, the filter decides what fades. Without one, the selection does.
        style:
          selectedNodeId && touchesSelected
            ? { stroke: sourceColor ?? "var(--primary)", strokeWidth: 3 }
            : (matchingIds ? !touchesMatch : selectedNodeId !== null)
              ? { opacity: FADED }
              : undefined,
      };
    });
  }, [template.template, items.items, relationships.relationships, selectedNodeId, matchingIds]);

  // Fires once when a drag ends: save the new position of every node that was dragged
  // (several if a selection was dragged). If a save fails, reload the saved positions.
  async function handleDragStop(draggedNodes: ItemNodeType[]) {
    setSaveError(null);
    try {
      await Promise.all(
        draggedNodes.map((node) => updateItem(node.id, { positionX: node.position.x, positionY: node.position.y })),
      );
      // Keep the items in step with the saved positions, so the nodes are not reset to old ones
      items.setItems((current) =>
        current.map((item) => {
          const node = draggedNodes.find((n) => n.id === item.id);
          return node ? { ...item, positionX: node.position.x, positionY: node.position.y } : item;
        }),
      );
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save the position.");
      items.refetch();
    }
  }

  // "Tidy up": lay the items out from left to right by their connections (tidyLayout.ts).
  // This overwrites the positions the user set by hand, so it asks first.
  // Only items that actually move are saved.
  // newDirection: set when the user picks the other direction. It is only kept if they confirm.
  async function handleTidy(newDirection: LayoutDirection = direction) {
    const ok = await confirm({
      title: "Tidy up the map?",
      message: "All items are moved into columns based on their connections. Positions you set by hand are replaced.",
      confirmLabel: "Tidy up",
    });
    if (!ok) return;
    setSaveError(null);
    // Flip the connections whose type reads backwards ("component belongs_to page"), so the flow
    // reads left to right: page -> component. The saved connections are not changed.
    const backward = new Set(template.template?.relationshipTypes.filter((t) => t.readsBackward).map((t) => t.key));
    const flow = relationships.relationships.map((r) =>
      backward.has(r.type)
        ? { sourceItemId: r.targetItemId, targetItemId: r.sourceItemId }
        : { sourceItemId: r.sourceItemId, targetItemId: r.targetItemId },
    );
    // The cards have different sizes, so the layout needs each item's size to leave enough room
    const sizedItems = items.items.map((item) => ({
      id: item.id,
      size: template.template ? getCardSize(template.template, item.type) : undefined,
    }));
    const positions = tidyLayout(sizedItems, flow, newDirection);
    setDirection(newDirection);
    writeFlag("map:vertical", newDirection === "vertical");
    const moved = items.items.filter((item) => {
      const p = positions.get(item.id);
      return p && (p.positionX !== item.positionX || p.positionY !== item.positionY);
    });
    try {
      await Promise.all(moved.map((item) => updateItem(item.id, positions.get(item.id)!)));
      // Updating the items rebuilds the nodes (itemNodes), so the map moves by itself
      items.setItems((current) => current.map((item) => ({ ...item, ...positions.get(item.id) })));
      // Wait for the nodes to move, then zoom so the whole map is in view
      setTimeout(() => flowRef.current?.fitView({ duration: 300 }), 50);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save the new positions.");
      items.refetch();
    }
  }

  // Full window: the map is fixed over the page (styles.expanded). While it is open the page behind
  // cannot scroll, and Esc closes it, unless a dialog or the tutorial is open (they use Esc themselves).
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.querySelector("dialog[open]") || document.getElementById("root")?.hasAttribute("inert")) return;
      setExpanded(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  // The map changes size when it expands or shrinks, so zoom to fit it again
  useEffect(() => {
    const timer = setTimeout(() => flowRef.current?.fitView({ duration: 200 }), 50);
    return () => clearTimeout(timer);
  }, [expanded]);

  // React Flow needs its own copy of the nodes: while dragging it updates positions (and sizes it
  // measures) through onNodesChange. The copy is reset whenever the items are loaded again.
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemNodeType>([]);
  useEffect(() => setNodes(itemNodes), [itemNodes, setNodes]);

  // Fading instead of hiding keeps the whole map and its connections in view.
  // With a filter, the filter decides and a selection only adds to it:
  // - Matches the filter: never faded, even when another item is selected.
  // - Filtered out, but connected to the selected item: half faded, so the connections can still be read.
  // - Filtered out and not connected: faded.
  // Without a filter: items not connected to the selected item fade.
  // The selected item itself is never faded: you clicked it.
  const shownNodes = useMemo(() => {
    let connectedIds: Set<string> | null = null;
    if (selectedNodeId) {
      connectedIds = new Set([selectedNodeId]);
      for (const r of relationships.relationships) {
        if (r.sourceItemId === selectedNodeId) connectedIds.add(r.targetItemId);
        if (r.targetItemId === selectedNodeId) connectedIds.add(r.sourceItemId);
      }
    }
    return nodes.map((node) => {
      const connected = connectedIds?.has(node.id) ?? false;
      let opacity: number | undefined;
      if (node.id === selectedNodeId) {
        opacity = undefined;
      } else if (matchingIds) {
        if (!matchingIds.has(node.id)) opacity = connected ? HALF_FADED : FADED;
      } else if (connectedIds && !connected) {
        opacity = FADED;
      }
      return opacity === undefined ? node : { ...node, style: { ...node.style, opacity } };
    });
  }, [nodes, relationships.relationships, selectedNodeId, matchingIds]);

  // Creates the connection that was dragged. Returns an error message, or null when it worked.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  async function connect(relationshipType: string) {
    if (!pending) return null;
    try {
      const relationship = await createRelationship({
        sourceItemId: pending.sourceId,
        targetItemId: pending.targetId,
        type: relationshipType,
      });
      relationships.setRelationships((current) => [...current, relationship]);
      setPending(null);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Something went wrong.";
    }
  }

  async function handleDeleteConnection(id: string) {
    if (!(await confirm({ title: "Remove connection?", message: "This connection will be removed.", confirmLabel: "Remove" }))) return;
    setSaveError(null);
    try {
      await deleteRelationship(id);
      relationships.setRelationships((current) => current.filter((r) => r.id !== id));
      setSelectedEdgeId(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (groups.error) groups.refetch();
  }

  if (loading) return <Loader label="Loading map…" size="page" />;

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  const pendingSource = items.items.find((item) => item.id === pending?.sourceId);
  const pendingTarget = items.items.find((item) => item.id === pending?.targetId);

  const selectedEdge = relationships.relationships.find((r) => r.id === selectedEdgeId);
  const edgeSource = items.items.find((item) => item.id === selectedEdge?.sourceItemId);
  const edgeTarget = items.items.find((item) => item.id === selectedEdge?.targetItemId);
  const edgeLabel = template.template?.relationshipTypes.find((type) => type.key === selectedEdge?.type)?.label;

  // The messages that float at the bottom of the map. Only shown when there is at least one.
  const hasMessage = items.items.length === 0 || (selectedEdge && edgeSource && edgeTarget) || saveError;
  // A new connection is waiting for its relationship type
  // The template decides the direction of a relationship (a page uses a component, never the other way around).
  // If the arrow was dragged the "wrong" way, turn it around, so it does not matter which card you start on.
  function handleConnect(connection: Connection) {
    let sourceId = connection.source;
    let targetId = connection.target;
    const from = items.items.find((item) => item.id === sourceId);
    const to = items.items.find((item) => item.id === targetId);
    if (from && to && template.template) {
      const forward = getAllowedRelationshipTypes(from.type, to.type, template.template);
      const backward = getAllowedRelationshipTypes(to.type, from.type, template.template);
      if (forward.length === 0 && backward.length > 0) [sourceId, targetId] = [targetId, sourceId];
    }
    setPending({ sourceId, targetId });
  }

  const prompting = Boolean(pendingSource && pendingTarget && template.template);

  return (
    // The controls float over the map in Panels instead of taking space above it.
    // A Panel stays in its corner when the map is moved or zoomed.
    <div className={expanded ? `${styles.map} ${styles.expanded}` : styles.map}>
      {modal}
      <ReactFlow
        nodes={shownNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        // A click on a node lights up its connections. A double click opens the item's detail view.
        // The node id is the item id.
        onNodeClick={(_event, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onNodeDoubleClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_event, _node, draggedNodes) => handleDragStop(draggedNodes as ItemNodeType[])}
        // Loose mode: a connection can start and end on any dot. Without it, a drag only works from a "source" dot
        // (right) to a "target" dot (left). The direction is still where you start dragging: source = the node you
        // dragged from, target = the node you dropped on.
        connectionMode={ConnectionMode.Loose}
        onConnect={handleConnect}
        // Click a connection to get a delete button, click the background to dismiss it
        onEdgeClick={(_event, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
        }}
        onPaneClick={() => {
          setSelectedEdgeId(null);
          setSelectedNodeId(null);
        }}
        // An item cannot be connected to itself
        isValidConnection={(connection) => connection.source !== connection.target}
        // React Flow removes selected nodes and edges on Backspace by default. That only removed them from the map,
        // not from the database, so they came back on reload. Turned off: items are deleted on the item page
        // (with a confirmation that lists what else is deleted), connections with "Delete connection".
        deleteKeyCode={null}
        fitView
      >
        <Background />
        <Controls />
        {template.template && (
          <>
            {/* Top left: the filters and "Add item". The add form opens under them, in the same box. */}
            {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
            <Panel position="top-left" className={styles.box} data-tour="map-toolbar">
              <div className={styles.toolbar}>
                {/* The filters open in a panel under the toolbar. The button shows how many are on. */}
                <button
                  type="button"
                  className={styles.small}
                  aria-expanded={filtering}
                  onClick={() => setFiltering((open) => !open)}
                >
                  Filter{activeFilterCount > 0 && ` (${activeFilterCount})`} {filtering ? "▴" : "▾"}
                </button>
                {!adding && (
                  <button type="button" className={styles.small} onClick={() => setAdding(true)}>
                    + Add item
                  </button>
                )}
                {!adding && items.items.length > 1 && (
                  <button
                    type="button"
                    className={styles.small}
                    aria-expanded={managing}
                    onClick={() => setManaging((open) => !open)}
                  >
                    Manage {managing ? "▴" : "▾"}
                  </button>
                )}
              </div>
              {filtering && (
                <div className={styles.manage}>
                  <ItemFilterBar
                    filters={filters}
                    onChange={setFilters}
                    template={template.template}
                    groups={groups.groups}
                  />
                </div>
              )}
              {managing && !adding && items.items.length > 1 && (
                <div className={styles.manage}>
                  <button
                    type="button"
                    className={styles.small}
                    onClick={() => {
                      setManaging(false);
                      handleTidy();
                    }}
                  >
                    Tidy up
                  </button>
                  {/* Picking the other direction tidies the map in that direction (after a confirm) */}
                  <span className={styles.direction} role="group" aria-label="Map direction">
                    <button
                      type="button"
                      className={styles.small}
                      aria-pressed={direction === "horizontal"}
                      onClick={() => direction !== "horizontal" && handleTidy("horizontal")}
                    >
                      Left → right
                    </button>
                    <button
                      type="button"
                      className={styles.small}
                      aria-pressed={direction === "vertical"}
                      onClick={() => direction !== "vertical" && handleTidy("vertical")}
                    >
                      Top ↓ bottom
                    </button>
                  </span>
                </div>
              )}
              {adding && (
                <div className={styles.addForm}>
                  <ItemForm
                    types={template.template.itemTypes}
                    submitLabel="Add item"
                    onCancel={() => setAdding(false)}
                    onSubmit={async ({ title, description, type }) => {
                      try {
                        // The backend gives the new item a start position (services/itemLayout.ts)
                        const item = await createItem(project.id, {
                          title,
                          type,
                          ...(description !== "" && { description }),
                        });
                        items.setItems((current) => [...current, item]);
                        setAdding(false);
                        return null;
                      } catch (err) {
                        return err instanceof ApiError ? err.message : "Something went wrong.";
                      }
                    }}
                  />
                </div>
              )}
            </Panel>
            {/* Top right: the full window button and the legend side by side. data-tour is on the
                legend only, so the tutorial does not light up the button too. */}
            <Panel position="top-right" className={styles.topRight}>
              <button
                type="button"
                className={`${styles.small} ${styles.fullWindow}`}
                aria-pressed={expanded}
                onClick={() => setExpanded((open) => !open)}
                title={expanded ? "Back to the normal size (Esc)" : "Make the map fill the whole window"}
              >
                {expanded ? "Exit full window" : "Full window"}
              </button>
              <div data-tour="map-legend">
                <MapLegend template={template.template} />
              </div>
            </Panel>
          </>
        )}
        {/* Bottom center, one box for everything that needs an answer, so two never overlap:
            picking a relationship type after dragging an arrow between two nodes, or else the clicked
            connection with its delete button, or the empty state. Errors show in both cases. */}
        {(prompting || hasMessage) && (
          <Panel position="bottom-center" className={`${styles.box} ${styles.message}`}>
            {pendingSource && pendingTarget && template.template ? (
              // key: a new prompt (with fresh state) for every new connection
              <ConnectionPrompt
                key={`${pendingSource.id}-${pendingTarget.id}`}
                source={pendingSource}
                target={pendingTarget}
                template={template.template}
                onSubmit={connect}
                onCancel={() => setPending(null)}
              />
            ) : (
              <>
                {items.items.length === 0 && <p>No items yet. Use “+ Add item” to create the first one.</p>}
                {selectedEdge && edgeSource && edgeTarget && (
                  <>
                    <p>
                      {edgeSource.title} {edgeLabel ?? "Unknown"} {edgeTarget.title}
                    </p>
                    <button type="button" onClick={() => handleDeleteConnection(selectedEdge.id)}>
                      Delete connection
                    </button>
                  </>
                )}
              </>
            )}
            {saveError && <p role="alert">{saveError}</p>}
          </Panel>
        )}
        {/* Overview in the corner: every item as a small block in its type's color. Drag or scroll it to move the map. */}
        <MiniMap<ItemNodeType>
          // The MiniMap sets an SVG fill attribute, which can't read CSS variables, so the
          // fallback for unknown types is a hex value (the same as --borderDark)
          nodeColor={(node) => node.data.color ?? "#bdae99"}
          nodeBorderRadius={4}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
