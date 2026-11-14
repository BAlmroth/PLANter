// The words PLANter uses that a beginner may not know, shown in the "Words" section of the Help page.
// Categories and connections are not here: they come from the template and have their own sections.
// Plain data, like PAGE_HELP, so the texts are easy to change.

export type GlossaryEntry = {
  word: string;
  meaning: string; // one or two plain sentences
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    word: "Item",
    meaning: "One thing you plan to build, like a page, a button or a game character. Every item has a category.",
  },
  {
    word: "Status",
    meaning: "How far an item or task has come: Planned, In progress or Done. Only Done counts as finished in the progress.",
  },
  {
    word: "MVP",
    meaning:
      "Minimum viable product: the smallest version of your project that still works and is worth showing. Mark the items that must be in it, and build those first.",
  },
  {
    word: "Group",
    meaning:
      "Your own collection of items that belong together, like everything for the checkout. An item keeps its category and can be in several groups.",
  },
  {
    word: "Task",
    meaning: "A concrete to-do, like “Write the login form”. A task can be linked to the item it is about.",
  },
  {
    word: "Sprint",
    meaning:
      "A short, fixed stretch of work, often one or two weeks, with the tasks you plan to finish in it. Name them as you like, for example “Sprint 1”.",
  },
  {
    word: "Warning",
    meaning:
      "A hint that an item is probably missing something, like a page with no components. It is shown with a “!” on the item.",
  },
  {
    word: "Requirements",
    meaning:
      "Game projects only: what it takes to get an item, like what it is made from, what it costs and what unlocks it. Shown on the item's page.",
  },
  {
    word: "Amount",
    meaning: "Game projects only: how many of something a connection needs, like a house made from 20 wood.",
  },
  {
    word: "Condition",
    meaning:
      "Game projects only: a requirement that is not an item, written as text, like “only in summer” or “from level 5”.",
  },
];
