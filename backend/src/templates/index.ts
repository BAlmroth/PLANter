import { webTemplate } from "./web.js";

//Defines and distributes templates though project

export type Template = {
  key: string;
  label: string;
  itemTypes: { key: string; label: string; pluralLabel: string; countsTowardProgress: boolean }[];
  relationshipTypes: {
    key: string;
    label: string;        // shown on the source item "uses: Button"
    inverseLabel: string; // shown on the target item "used by: LoginPage"
    allowCycles: boolean;
  }[];
  // Which source type can connect to which target type, with which relationship
  allowedCombinations: { source: string; relationship: string; target: string }[];
};

const templates = new Map<string, Template>([["web", webTemplate]]);

// Returns the template for a key, or undefined if it doesn't exist
export function getTemplate(key: string): Template | undefined {
  return templates.get(key);
}