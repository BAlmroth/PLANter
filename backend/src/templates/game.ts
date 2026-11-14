import type { Template } from "./index.js";

// KEYS ARE PERMANENT, LABELS ARE CUSTOMIZABLE.
// Read each relationship as a sentence: "<source> <label> <target>", e.g. "Old wizard appears in Dark forest".
//
// The game template is the game version of a game design document (GDD). It covers four areas:
//   - Gameplay: mechanics, abilities, screens & UI
//   - World and story: story, characters, locations, quests
//   - What the player carries: inventory
//   - Production: art, audio, playtests, engine & tools
// Kept small on purpose. Finer kinds are groups, not categories, because they connect the same way:
// enemies and bosses are characters in an "Enemies" group, weapons, potions and keys are inventory
// in groups like "Weapons", "Potions" and "Keys". Factions and acts are groups too.
// The label is "Inventory", not "Item", because every entry in PLANter is already called an item.

export const gameTemplate: Template = {
  key: "game",
  label: "Game",
  description: "Mechanics, story, characters, locations, quests and inventory.",

  // The order here is the order of the categories in the File view: the core mechanics first
  // (every game has them, not every game has a story), then the world, then production.
  // Colors: related types share a color family (systems blue-teal, narrative violet-purple).
  // Each color has at least 4.5:1 contrast (WCAG AA) on white, on --bg and on its own 12% tint,
  // so it can be used as text inside a pill of the same color.
  itemTypes: [
    { key: "mechanic", label: "Mechanic", pluralLabel: "Mechanics", countsTowardProgress: true, color: "#2563A8", size: "medium",
      description: "A rule or system the player plays with, like moving, fighting, crafting or saving.",
      example: "Jumping, Combat, Crafting, Save system" },
    { key: "story", label: "Story", pluralLabel: "Story", countsTowardProgress: true, color: "#6D4BB3", size: "large",
      description: "A chapter, scene or key event in the storyline.",
      example: "Prologue, The village burns, Final battle" },
    { key: "character", label: "Character", pluralLabel: "Characters", countsTowardProgress: true, color: "#B4234F", size: "medium",
      description: "Anyone in the game: the player character, friends, shopkeepers, enemies and bosses. Use groups to sort them.",
      example: "Hero, Blacksmith, Slime, Dragon" },
    { key: "location", label: "Location", pluralLabel: "Locations", countsTowardProgress: true, color: "#1A6E44", size: "large",
      description: "A place in the game world: a level, area, room or map.",
      example: "Starting village, Dark forest, Castle dungeon" },
    { key: "quest", label: "Quest", pluralLabel: "Quests", countsTowardProgress: true, color: "#8B3A9E", size: "medium",
      description: "A goal the player works toward: a mission, task or objective.",
      example: "Find the lost key, Defeat the dragon, Escort the merchant" },
    { key: "ability", label: "Ability", pluralLabel: "Abilities", countsTowardProgress: true, color: "#1C6E8C", size: "small",
      description: "Something a character can do: a skill, spell, attack or power.",
      example: "Double jump, Fireball, Dash" },
    { key: "inventory", label: "Inventory", pluralLabel: "Inventory", countsTowardProgress: true, color: "#A8380A", size: "small",
      description: "Anything the player can pick up and carry: weapons, armor, potions, keys. Use groups to sort them.",
      example: "Iron sword, Health potion, Castle key" },
    { key: "ui", label: "Screen & UI", pluralLabel: "Screens & UI", countsTowardProgress: true, color: "#0C6A67", size: "medium",
      description: "A menu, screen or overlay the player uses, like the main menu, the inventory screen or the HUD.",
      example: "Main menu, HUD, Inventory screen, Game over" },
    { key: "art", label: "Art", pluralLabel: "Art", countsTowardProgress: true, color: "#A3368F", size: "small",
      description: "What the game looks like: art style, sprites, 3D models, animations and effects.",
      example: "Pixel art style, Hero sprite sheet, Forest tileset" },
    { key: "audio", label: "Audio", pluralLabel: "Audio", countsTowardProgress: true, color: "#8A4F7D", size: "small",
      description: "Music, sound effects and voices.",
      example: "Main theme, Sword swing sound, Boss music" },
    { key: "testing", label: "Playtest", pluralLabel: "Playtests", countsTowardProgress: true, color: "#436C0D", size: "small",
      description: "A test or playtest that checks that something works, and that it is fun.",
      example: "First level playtest, Boss balance test, Save and load test" },
    { key: "tech_stack", label: "Engine & tools", pluralLabel: "Engine & tools", countsTowardProgress: true, color: "#4B5563", size: "small", overviewCard: true,
      description: "The engine, language and tools the game is built with.",
      example: "Godot, Unity, Aseprite, Blender" },
  ],

  // Same group colors as the web template: none of them is a game type color either.
  groupColors: ["#3D8FD1", "#2E9A6E", "#8C6FD1", "#B08A1E", "#D45A8A", "#2B9A9A", "#A5835A", "#6F9A2A"],

  relationshipTypes: [
    // --- Structure and order ---
    // Story order. No cycles: chapter 1 -> 2 -> 1 is a mistake (branches are fine, loops are not)
    { key: "leads_to", label: "leads to", inverseLabel: "comes after", allowCycles: false,
      description: "This part of the story comes right before that one." },
    // A room cannot contain the dungeon it is part of
    { key: "part_of", label: "part of", inverseLabel: "contains", allowCycles: false, readsBackward: true,
      description: "This is a smaller part of that one, for example a room in a dungeon or a step of a quest." },
    // Paths between places go both ways, so loops are normal (village -> forest -> village)
    { key: "connects_to", label: "connects to", inverseLabel: "reached from", allowCycles: true,
      description: "The player can walk, travel or teleport from this place to that one." },

    // --- Where things are ---
    { key: "takes_place_in", label: "takes place in", inverseLabel: "setting of", allowCycles: true, readsBackward: true,
      description: "This part of the story or quest happens in that place." },
    { key: "appears_in", label: "appears in", inverseLabel: "features", allowCycles: true, readsBackward: true,
      description: "The player meets or finds this in that place or part of the story." },

    // --- Progression: how the player gets further ---
    // No cycles: "the key is behind the door the key opens" is a soft-lock (the player gets stuck).
    // The cycle check in the relationship service catches it when the connection is made.
    { key: "unlocks", label: "unlocks", inverseLabel: "unlocked by", allowCycles: false,
      description: "This makes that available, for example a key that opens an area or a quest that starts the next one." },
    { key: "gives", label: "gives", inverseLabel: "given by", allowCycles: true,
      description: "The character hands this to the player: a quest, a gift, something from a shop or loot from a defeated enemy." },
    { key: "rewards", label: "rewards", inverseLabel: "earned from", allowCycles: true,
      description: "The player gets this for finishing the quest." },

    // --- How things work together ---
    { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true,
      description: "Uses that mechanic, ability, inventory, art, audio or tool, for example a level that uses swimming." },
    // Crafting, cooking, mixing. Stored as "result made_from ingredient", and read backwards so the map
    // puts the ingredients on the left and the results on the right (a recipe tree).
    // No cycles: a recipe that needs its own result somewhere down the chain can never be made.
    { key: "made_from", label: "made from", inverseLabel: "ingredient in", allowCycles: false, readsBackward: true,
      description: "This is crafted, cooked or mixed from that, for example a potion made from water and a herb." },
    { key: "grants", label: "grants", inverseLabel: "granted by", allowCycles: true,
      description: "Having or using this gives the player that ability, for example boots that grant a double jump." },

    // --- Screens ---
    // Menus link back to each other, so loops are normal (main menu -> settings -> main menu)
    { key: "opens", label: "opens", inverseLabel: "opened from", allowCycles: true,
      description: "This takes the player to that screen, like a pause menu that opens the settings." },
    { key: "shows", label: "shows", inverseLabel: "shown in", allowCycles: true,
      description: "The screen shows this to the player, like a HUD that shows the health." },

    // --- Testing ---
    { key: "tests", label: "tests", inverseLabel: "tested by", allowCycles: true, readsBackward: true,
      description: "This playtest checks that that thing works and feels right." },
  ],

  allowedCombinations: [
    // Story order and structure
    { source: "story", relationship: "leads_to", target: "story" },
    { source: "story", relationship: "part_of", target: "story" },        // a scene in an act
    { source: "quest", relationship: "part_of", target: "story" },        // main quest in chapter 2
    { source: "quest", relationship: "part_of", target: "quest" },        // a step of a bigger quest
    { source: "location", relationship: "part_of", target: "location" },  // a room in a dungeon
    { source: "mechanic", relationship: "part_of", target: "mechanic" },  // parry is part of combat
    { source: "ability", relationship: "part_of", target: "mechanic" },   // fireball is part of magic
    { source: "ui", relationship: "part_of", target: "ui" },              // health bar is part of the HUD

    // The world map
    { source: "location", relationship: "connects_to", target: "location" },

    // Where things happen and are found
    { source: "story", relationship: "takes_place_in", target: "location" },
    { source: "quest", relationship: "takes_place_in", target: "location" },
    { source: "character", relationship: "appears_in", target: "location" },
    { source: "character", relationship: "appears_in", target: "story" },
    { source: "inventory", relationship: "appears_in", target: "location" }, // found in a chest

    // Progression: what opens up what. "Ability or inventory opens an area" (double jump,
    // grappling hook) is included on purpose: it is one of the most common things to plan in a game.
    { source: "story", relationship: "unlocks", target: "quest" },
    { source: "story", relationship: "unlocks", target: "location" },
    { source: "story", relationship: "unlocks", target: "mechanic" },     // the tutorial introduces dashing
    { source: "quest", relationship: "unlocks", target: "quest" },
    { source: "quest", relationship: "unlocks", target: "story" },
    { source: "quest", relationship: "unlocks", target: "location" },
    { source: "quest", relationship: "unlocks", target: "mechanic" },
    { source: "character", relationship: "unlocks", target: "location" }, // beat the boss, the gate opens
    { source: "character", relationship: "unlocks", target: "story" },
    { source: "inventory", relationship: "unlocks", target: "location" }, // the castle key
    { source: "inventory", relationship: "unlocks", target: "quest" },    // a letter that starts a quest
    { source: "ability", relationship: "unlocks", target: "location" },   // double jump reaches the ledge

    // Getting things: quest givers, gifts, shops, loot and rewards
    { source: "character", relationship: "gives", target: "quest" },
    { source: "character", relationship: "gives", target: "inventory" },
    { source: "character", relationship: "gives", target: "ability" },   // a trainer teaches a skill
    { source: "quest", relationship: "rewards", target: "inventory" },
    { source: "quest", relationship: "rewards", target: "ability" },

    // Gameplay: who can do what
    { source: "character", relationship: "uses", target: "ability" },
    { source: "character", relationship: "uses", target: "inventory" },  // starting equipment
    { source: "character", relationship: "uses", target: "mechanic" },
    { source: "location", relationship: "uses", target: "mechanic" },     // the water level uses swimming
    { source: "quest", relationship: "uses", target: "mechanic" },        // a stealth mission
    { source: "inventory", relationship: "uses", target: "mechanic" },
    { source: "inventory", relationship: "uses", target: "inventory" },  // a bow uses arrows
    { source: "inventory", relationship: "made_from", target: "inventory" }, // emerald tea made from water and emerald
    { source: "inventory", relationship: "grants", target: "ability" },

    // Screens
    { source: "ui", relationship: "opens", target: "ui" },
    { source: "mechanic", relationship: "opens", target: "ui" },          // dying opens the game over screen
    { source: "character", relationship: "opens", target: "ui" },         // talking to the shopkeeper opens the shop
    { source: "ui", relationship: "shows", target: "mechanic" },
    { source: "ui", relationship: "shows", target: "ability" },
    { source: "ui", relationship: "shows", target: "quest" },
    { source: "ui", relationship: "shows", target: "character" },
    { source: "ui", relationship: "shows", target: "location" },          // the map screen
    { source: "ui", relationship: "shows", target: "inventory" },

    // Art and audio: what needs to be drawn and what needs a sound
    { source: "story", relationship: "uses", target: "art" },             // a cutscene
    { source: "character", relationship: "uses", target: "art" },
    { source: "location", relationship: "uses", target: "art" },
    { source: "ability", relationship: "uses", target: "art" },           // a spell effect
    { source: "inventory", relationship: "uses", target: "art" },
    { source: "ui", relationship: "uses", target: "art" },
    { source: "story", relationship: "uses", target: "audio" },
    { source: "character", relationship: "uses", target: "audio" },       // a voice
    { source: "location", relationship: "uses", target: "audio" },        // the level's music
    { source: "ability", relationship: "uses", target: "audio" },
    { source: "inventory", relationship: "uses", target: "audio" },
    { source: "mechanic", relationship: "uses", target: "audio" },        // footsteps
    { source: "ui", relationship: "uses", target: "audio" },              // button clicks

    // Engine & tools (like in the web template, the gameplay types are left out on purpose:
    // almost everything would point at the engine)
    { source: "mechanic", relationship: "uses", target: "tech_stack" },   // physics uses the engine
    { source: "ui", relationship: "uses", target: "tech_stack" },
    { source: "location", relationship: "uses", target: "tech_stack" },   // a level editor like Tiled
    { source: "art", relationship: "uses", target: "tech_stack" },        // Aseprite, Blender
    { source: "audio", relationship: "uses", target: "tech_stack" },
    { source: "testing", relationship: "uses", target: "tech_stack" },

    // Playtests
    { source: "testing", relationship: "tests", target: "mechanic" },
    { source: "testing", relationship: "tests", target: "ability" },
    { source: "testing", relationship: "tests", target: "location" },
    { source: "testing", relationship: "tests", target: "quest" },
    { source: "testing", relationship: "tests", target: "story" },
    { source: "testing", relationship: "tests", target: "character" },    // boss balance
    { source: "testing", relationship: "tests", target: "inventory" },
    { source: "testing", relationship: "tests", target: "ui" },
  ],

  // Only rules where a missing link is almost always a real mistake. Left out on purpose:
  // "location not reached from anywhere" (the starting location never is), "screen not opened
  // from anything" (the main menu and the HUD never are), "quest with no reward" (story quests).
  warningRules: [
    // A character (or enemy) that is nowhere in the world or the story is never met
    { key: "character_not_placed", itemType: "character", relationship: "appears_in", direction: "outgoing", message: "does not appear anywhere" },
  ],

  // The categories people tend to forget until the end. Story and quests are left out
  // on purpose: many good games have none (puzzle games, racing games).
  checklistItemTypes: [
    { itemType: "mechanic", label: "Define the core mechanics" },
    { itemType: "ui", label: "Plan the menus and HUD" },
    { itemType: "art", label: "Decide the art style" },
    { itemType: "audio", label: "Plan music and sounds" },
    { itemType: "tech_stack", label: "Choose the engine" },
    { itemType: "testing", label: "Plan the playtests" },
  ],
};
