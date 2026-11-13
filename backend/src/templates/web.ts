 import type { Template } from "./index.js";

// KEYS ARE PERMANENT, LABELS ARE CUSTIMIZABLE.
// Read each relationship as a sentence: "<source> <label> <target>", e.g. "authentication (shown as Security) protects page".


export const webTemplate: Template = {
  key: "web",
  label: "Web Project",

  // The order here is the order of the categories in the File view.
  // Colors: related types share a color family (page/component blue-teal, design/asset
  // magenta-orange). Each color has at least 4.5:1 contrast (WCAG AA) on white, on --bg
  // and on its own 12% tint, so it can be used as text inside a pill of the same color.
itemTypes: [
  { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8",
    description: "A screen the user can visit, usually with its own address (URL).",
    example: "Home, Login, Profile" },
  { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#0F7673",
    description: "A reusable piece of a page, like a menu, a form or a card.",
    example: "Header, LoginForm, ProductCard" },
  { key: "function", label: "Functionality", pluralLabel: "Functionality", countsTowardProgress: true, color: "#6D4BB3",
    description: "Something the app does when the user acts or something happens.",
    example: "Log in, Send message, Calculate total" },
  { key: "data", label: "Data", pluralLabel: "Data", countsTowardProgress: true, color: "#8A5A0B",
    description: "Something the app stores, usually a table in the database.",
    example: "Users, Orders, Comments" },
  { key: "authentication", label: "Security", pluralLabel: "Security", countsTowardProgress: true, color: "#B4234F",
    description: "How the app protects users and itself: login, permissions, input checks and error handling.",
    example: "Email login, Admin only, Input validation, Error handling" },
  { key: "design", label: "Design", pluralLabel: "Designs", countsTowardProgress: true, color: "#A3368F",
    description: "How it should look: colors, fonts, layouts and wireframes.",
    example: "Color palette, Mobile layout, Figma wireframe" },
  { key: "asset", label: "Asset", pluralLabel: "Assets", countsTowardProgress: true, color: "#A8380A",
    description: "Files the app needs, like images, icons, fonts and videos.",
    example: "Logo, Hero image, Icon set" },
  { key: "testing", label: "Test", pluralLabel: "Tests", countsTowardProgress: true, color: "#436C0D",
    description: "A test that checks that something works as planned.",
    example: "Login form test, Checkout test" },
  { key: "tech_stack", label: "Tech stack", pluralLabel: "Tech stack", countsTowardProgress: true, color: "#4B5563",
    description: "A language, tool or service the project is built with.",
    example: "React, Express, Supabase" },
],
  // Group colors: shown as dots and card borders, never as text, so they need 3:1 contrast
  // (WCAG, non-text) instead of 4.5:1. All are between 3.2:1 and 4:1 on white, lighter than the
  // type colors above (5:1 and up), so the two sets look different.
  // In order: sky, mint, lavender, gold, rose, sea, sand, lime. New groups take the next unused one.
  groupColors: ["#3D8FD1", "#2E9A6E", "#8C6FD1", "#B08A1E", "#D45A8A", "#2B9A9A", "#A5835A", "#6F9A2A"],
  relationshipTypes: [
    // A component cannot contain the thing it uses so no cycles
    // Labelled "part of" / "contains", not "used by" / "uses": those words belong to the "uses"
    // type below, and one phrase must never mean two connections.
    { key: "belongs_to", label: "part of", inverseLabel: "contains", allowCycles: false,
      description: "The component is a part of that page or component." },
    // Functions may call each other in a loop
    { key: "triggers", label: "triggers", inverseLabel: "triggered by", allowCycles: true,
      description: "Doing something here runs that functionality." },
    // Pages link to each other, so loops are normal (home -> about -> home)
    { key: "navigates_to", label: "navigates to", inverseLabel: "reached by", allowCycles: true,
      description: "Takes the user to that page." },
    { key: "reads_from", label: "reads from", inverseLabel: "read by", allowCycles: true,
      description: "The functionality fetches that data." },
    { key: "writes_to", label: "writes to", inverseLabel: "written by", allowCycles: true,
      description: "The functionality saves or changes that data." },
    { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true,
      description: "Uses that design or asset, for example a color palette or a logo." },
    { key: "protects", label: "protects", inverseLabel: "protected by", allowCycles: true,
      description: "Only users who pass this check can reach that page or functionality." },
    { key: "tests", label: "tests", inverseLabel: "tested by", allowCycles: true,
      description: "This test checks that that thing works." },
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

  // The categories people tend to forget until the end. Assets are left out on purpose:
  // some projects really have none, and a check that is often wrong gets ignored.
  checklistItemTypes: [
    { itemType: "design", label: "Plan the design" },
    { itemType: "tech_stack", label: "Choose the tech stack" },
    { itemType: "data", label: "Plan the data" },
    { itemType: "authentication", label: "Plan security" },
    { itemType: "testing", label: "Plan the tests" },
  ],
};
