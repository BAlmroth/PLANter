import { webTemplate } from "./web.js";

//Defines and distributes templates though project

export type Template = {
  key: string;
  label: string;
  itemTypes: {
    key: string;
    label: string;
    pluralLabel: string;
    countsTowardProgress: boolean;
    // "#RRGGBB". The type's color everywhere in the UI (pill, map node, progress bar).
    // Presentation only, like the label: it can be changed without a migration.
    color: string;
    // How big the card is on the map: pages large, small things (assets, tests) small.
    // Presentation only, like color and label. Missing = "medium".
    size?: "small" | "medium" | "large";
    // Help text for beginners: what this category is, in one plain sentence,
    // and a few typical names. Presentation only, like the label.
    description: string;
    example: string;
  }[];
  // The colors a group can have ("#RRGGBB"). Lighter than the item type colors, so a group
  // never looks like an item type. A group stores the hex itself, so changing this list
  // does not change existing groups (only which colors new choices can use).
  groupColors: string[];
  relationshipTypes: {
    key: string;
    label: string;        // shown on the source item "uses: Button"
    inverseLabel: string; // shown on the target item "used by: LoginPage"
    allowCycles: boolean;
    // Presentation only, like a label: the map reads the flow from left to right, "page -> component -> data".
    // For a type stored the other way round ("component belongs_to page") this is true, so the
    // map's layout puts the target on the left. The stored direction does not change.
    readsBackward?: boolean;
    description: string;  // help text: what the connection means, in one plain sentence
  }[];
  // Which source type can connect to which target type, with which relationship
  allowedCombinations: { source: string; relationship: string; target: string }[];
  // Warnings for items that are probably missing a connection.
  // A rule fires for every item of `itemType` that has no connection of type `relationship`
  // in the given direction. "incoming" = the item is the target ("component belongs_to page"
  // makes a page the target), "outgoing" = the item is the source.
  warningRules: {
    key: string;
    itemType: string;
    relationship: string;
    direction: "incoming" | "outgoing";
    message: string; // shown after the item title, e.g. "Home: has no components"
  }[];
  // Categories a project usually needs and that are easy to forget (tests, auth...).
  // The project checklist has one check per entry: passed when the project has at least one item of `itemType`.
  // `label` is written as a todo ("Plan the tests"), so it reads well both as "yet to plan" and with a ✓.
  checklistItemTypes: {
    itemType: string;
    label: string;
  }[];
};

const templates = new Map<string, Template>([["web", webTemplate]]);

// Returns the template for a key, or undefined if it doesn't exist
export function getTemplate(key: string): Template | undefined {
  return templates.get(key);
}