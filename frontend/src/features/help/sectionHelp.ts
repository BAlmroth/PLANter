// Short texts for the small "i" bubbles next to section headings. They only say what each part is,
// not how to add or use things. Plain data, so the texts are easy to change.
export const SECTION_HELP = {
  progress:
    "How much of your plan is done, in total and per category. “Yet to plan” shows categories your plan is missing, and item warnings show items that are probably missing something.",
  tasks:
    "Tasks are the concrete to-dos of your project. A sprint is a short stretch of work, like one week, with the tasks you plan to finish in it.",
  moodboard: "How the project should look and feel: images, notes and the project's color palette.",
  inspiration: "Sites, apps or games you like, and what you like about them.",
  list: "Everything you plan to build, sorted by category or by your own groups.",
  map: "Your items drawn as a map. The arrows are the connections between them.",
} satisfies Record<string, string>;
