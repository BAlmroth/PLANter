 import type { Template } from "./index.js";

// KEYS ARE PERMANENT, LABELS ARE CUSTIMIZABLE.
// Read each relationship as a sentence: "<source> <label> <target>", e.g. "authentication protects page".


export const webTemplate: Template = {
  key: "web",
  label: "Web Project",

  // The order here is the order of the categories in the File view.
  // Colors: related types share a color family (page/component blue-teal, design/asset
  // magenta-orange). Each color has at least 4.5:1 contrast (WCAG AA) on white, on --bg
  // and on its own 12% tint, so it can be used as text inside a pill of the same color.
itemTypes: [
  { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8" },
  { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#0F7673" },
  { key: "function", label: "Function", pluralLabel: "Functions", countsTowardProgress: true, color: "#6D4BB3" },
  { key: "data", label: "Data", pluralLabel: "Data", countsTowardProgress: true, color: "#8A5A0B" },
  { key: "authentication", label: "Authentication", pluralLabel: "Authentication", countsTowardProgress: true, color: "#B4234F" },
  { key: "design", label: "Design", pluralLabel: "Designs", countsTowardProgress: true, color: "#A3368F" },
  { key: "asset", label: "Asset", pluralLabel: "Assets", countsTowardProgress: true, color: "#A8380A" },
  { key: "testing", label: "Test", pluralLabel: "Tests", countsTowardProgress: true, color: "#436C0D" },
  { key: "tech_stack", label: "Tech stack", pluralLabel: "Tech stack", countsTowardProgress: true, color: "#4B5563" },
],
  relationshipTypes: [
    // A component cannot contain the thing it uses so no cycles
    { key: "belongs_to", label: "used by", inverseLabel: "uses", allowCycles: false },
    // Functions may call each other in a loop
    { key: "triggers", label: "triggers", inverseLabel: "triggered by", allowCycles: true },
    // Pages link to each other, so loops are normal (home -> about -> home)
    { key: "navigates_to", label: "navigates to", inverseLabel: "reached by", allowCycles: true },
    { key: "reads_from", label: "reads from", inverseLabel: "read by", allowCycles: true },
    { key: "writes_to", label: "writes to", inverseLabel: "written by", allowCycles: true },
    { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true },
    { key: "protects", label: "protects", inverseLabel: "protected by", allowCycles: true },
    { key: "tests", label: "tests", inverseLabel: "tested by", allowCycles: true },
  ],

  allowedCombinations: [
    // Structure: what a screen is made of
    { source: "component", relationship: "belongs_to", target: "page" },
    { source: "component", relationship: "belongs_to", target: "component" },

    // Behaviour: what happens on an action
    { source: "page", relationship: "triggers", target: "function" },
    { source: "component", relationship: "triggers", target: "function" },
    { source: "page", relationship: "navigates_to", target: "page" },
    { source: "component", relationship: "navigates_to", target: "page" },
    { source: "function", relationship: "triggers", target: "function" },

    // Data: what touches a table
    { source: "function", relationship: "reads_from", target: "data" },
    { source: "function", relationship: "writes_to", target: "data" },

    // design
    { source: "page", relationship: "uses", target: "design" },
    { source: "component", relationship: "uses", target: "design" },
    { source: "page", relationship: "uses", target: "asset" },
    { source: "component", relationship: "uses", target: "asset" },

    // Security
    { source: "authentication", relationship: "protects", target: "page" },
    { source: "authentication", relationship: "protects", target: "function" },

    // Testing
    { source: "testing", relationship: "tests", target: "page" },
    { source: "testing", relationship: "tests", target: "component" },
    { source: "testing", relationship: "tests", target: "function" },
    { source: "testing", relationship: "tests", target: "authentication" },
  ],

  warningRules: [
    // A page with no component belonging to it is probably an empty page
    { key: "page_without_components", itemType: "page", relationship: "belongs_to", direction: "incoming", message: "has no components" },
    // A function nothing triggers is probably never run
    { key: "function_not_triggered", itemType: "function", relationship: "triggers", direction: "incoming", message: "is not triggered by anything" },
  ],
};
