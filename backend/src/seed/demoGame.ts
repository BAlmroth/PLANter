// Seed data for the demo project "Emerald Brew": a small cozy game about mixing ingredients
// into new things. Kept small on purpose (25 items), but it uses every game category and every
// connection type, so each part of the game template can be seen: recipes with amounts, a price,
// an upgrade, "unlocked by", a condition, groups as sub-kinds (enemies, ingredients, currency).
// Plain data only, checked against the game template in tests/seedDemo.test.ts.
import type { DemoData } from "./types.js";

export const gameDemo: DemoData = {
  project: {
    name: "Emerald Brew",
    template: "game",
    description:
      "A cozy game about mixing things like water, coffee and emeralds into new items. " +
      "Demo data for the game template: open Emerald tea or Cottage, level 2 to see the Requirements card.",
  },

  // Columns on the map, left to right: ingredients, what is made from them, gameplay and screens,
  // places, people and story
  items: [
    // INVENTORY: ingredients and currency
    { ref: "water", col: 0, row: 0, type: "inventory", title: "Water", description: "Free from the well in the meadow.", status: "done" },
    { ref: "coffee", col: 0, row: 1, type: "inventory", title: "Coffee", description: "Bought from Bo.", status: "done" },
    { ref: "emerald", col: 0, row: 2, type: "inventory", title: "Emerald", description: "Mined in the emerald mine.", status: "planned" },
    { ref: "seeds", col: 0, row: 3, type: "inventory", title: "Flower seeds", description: "Found in the meadow.", status: "in_progress" },
    { ref: "wood", col: 0, row: 4, type: "inventory", title: "Wood", description: "Building material.", status: "planned" },
    { ref: "gold", col: 0, row: 5, type: "inventory", title: "Gold", description: "The only currency.", status: "done" },

    // INVENTORY: results, and what they give
    { ref: "tea", col: 1, row: 1, type: "inventory", title: "Emerald tea", description: "The first real recipe. Makes plants grow faster for a day.", status: "in_progress", isMvp: true,
      details: [{ title: "Recipe idea", text: "Mixing order should not matter: water + emerald = emerald + water." }] },
    { ref: "greenThumb", col: 2, row: 1, type: "ability", title: "Green thumb", description: "Plants grow twice as fast.", status: "planned" },

    // GAMEPLAY AND SCREENS
    { ref: "mixing", col: 1, row: 3, type: "mechanic", title: "Mixing", description: "Put two or three ingredients in the pot and get something new.", status: "done", isMvp: true },
    { ref: "mixScreen", col: 2, row: 3, type: "ui", title: "Mixing screen", description: "The pot, the ingredient slots and the result.", status: "in_progress", isMvp: true },
    { ref: "hud", col: 2, row: 5, type: "ui", title: "HUD", description: "Gold and the current quest.", status: "planned" },
    { ref: "mixTest", col: 2, row: 4, type: "testing", title: "Mixing playtest", description: "Do players find the recipes without a guide?", status: "planned" },
    { ref: "godot", col: 1, row: 5, type: "tech_stack", title: "Godot", status: "done" },
    { ref: "pixelArt", col: 3, row: 5, type: "art", title: "Cozy pixel art", description: "Soft colors, 16x16 tiles.", status: "in_progress" },
    { ref: "meadowTheme", col: 4, row: 5, type: "audio", title: "Meadow theme", description: "Slow acoustic guitar.", status: "planned" },

    // PLACES
    { ref: "meadow", col: 3, row: 0, type: "location", title: "Meadow", description: "Flowers, a well and Bo's stall.", status: "in_progress" },
    { ref: "cottage", col: 3, row: 2, type: "location", title: "Cottage", description: "Where the player lives and mixes.", status: "done", isMvp: true },
    { ref: "cottage2", col: 4, row: 2, type: "location", title: "Cottage, level 2", description: "A bigger cottage with a second mixing pot.", status: "planned",
      conditions: "Can only be built in summer." },
    { ref: "mine", col: 3, row: 4, type: "location", title: "Emerald mine", description: "Dark, with slimes.", status: "planned" },

    // PEOPLE AND STORY
    { ref: "ivy", col: 4, row: 3, type: "character", title: "Grandma Ivy", description: "Teaches the player to mix.", status: "done" },
    { ref: "bo", col: 4, row: 0, type: "character", title: "Bo the trader", description: "Sells coffee from a stall in the meadow.", status: "in_progress" },
    { ref: "slime", col: 4, row: 4, type: "character", title: "Mine slime", description: "Slow and harmless, but blocks the tunnels.", status: "planned" },
    { ref: "fixQuest", col: 5, row: 2, type: "quest", title: "Fix up the cottage", description: "Grandma's first task. Teaches mixing and building.", status: "in_progress", isMvp: true },
    { ref: "prologue", col: 6, row: 2, type: "story", title: "Prologue: Grandma's cottage", status: "done" },
    { ref: "chapter1", col: 6, row: 4, type: "story", title: "Chapter 1: The emerald mine", status: "planned" },
  ],

  relationships: [
    // Recipes and building, with amounts (shown in the Requirements card)
    { source: "tea", type: "made_from", target: "emerald", quantity: 1 },
    { source: "tea", type: "made_from", target: "water", quantity: 2 },
    { source: "tea", type: "made_from", target: "coffee", quantity: 1 },
    { source: "cottage2", type: "made_from", target: "wood", quantity: 20 },
    // Prices
    { source: "coffee", type: "costs", target: "gold", quantity: 5 },
    { source: "cottage2", type: "costs", target: "gold", quantity: 500 },
    // Upgrades and progression
    { source: "cottage", type: "upgrades_to", target: "cottage2" },
    { source: "fixQuest", type: "unlocks", target: "cottage2" },
    { source: "chapter1", type: "unlocks", target: "mine" },
    { source: "tea", type: "grants", target: "greenThumb" },
    // Story
    { source: "prologue", type: "leads_to", target: "chapter1" },
    { source: "fixQuest", type: "part_of", target: "prologue" },
    { source: "prologue", type: "takes_place_in", target: "cottage" },
    { source: "fixQuest", type: "takes_place_in", target: "cottage" },
    // People
    { source: "ivy", type: "gives", target: "fixQuest" },
    { source: "bo", type: "gives", target: "coffee" },
    { source: "fixQuest", type: "rewards", target: "gold" },
    // The world: where things are
    { source: "cottage", type: "connects_to", target: "meadow" },
    { source: "meadow", type: "connects_to", target: "mine" },
    { source: "ivy", type: "appears_in", target: "cottage" },
    { source: "bo", type: "appears_in", target: "meadow" },
    { source: "slime", type: "appears_in", target: "mine" },
    { source: "slime", type: "appears_in", target: "chapter1" },
    { source: "water", type: "appears_in", target: "meadow" },
    { source: "seeds", type: "appears_in", target: "meadow" },
    { source: "emerald", type: "appears_in", target: "mine" },
    { source: "wood", type: "appears_in", target: "meadow" },
    // Gameplay, screens and production
    { source: "mixing", type: "opens", target: "mixScreen" },
    { source: "hud", type: "shows", target: "gold" },
    { source: "hud", type: "shows", target: "fixQuest" },
    { source: "mixing", type: "uses", target: "godot" },
    { source: "mixScreen", type: "uses", target: "pixelArt" },
    { source: "cottage", type: "uses", target: "pixelArt" },
    { source: "meadow", type: "uses", target: "meadowTheme" },
    { source: "mixTest", type: "tests", target: "mixing" },
    { source: "mixTest", type: "tests", target: "mixScreen" },
  ],

  // Sub-kinds are groups, not categories (see the comment at the top of templates/game.ts)
  groups: [
    { name: "Ingredients", description: "Things that go into the pot.", items: ["water", "coffee", "emerald", "seeds"] },
    { name: "Currency", items: ["gold"] },
    { name: "Enemies", items: ["slime"] },
  ],

  sprints: [
    {
      name: "Sprint 1: Mixing",
      tasks: [
        { title: "Make the pot accept two ingredients", item: "mixing", done: true },
        { title: "Draw the mixing screen", item: "mixScreen", done: false },
        { title: "Balance the Emerald tea recipe", item: "tea", done: false },
      ],
    },
  ],

  backlogTasks: [
    { title: "Write Grandma's first dialogue", item: "fixQuest", done: false },
    { title: "Plan the cottage upgrade", item: "cottage2", done: false },
  ],

  inspirations: [
    { title: "Cozy and calm", text: "No fail states and lots of small rewards. Every new recipe should feel like a discovery." },
  ],
};
