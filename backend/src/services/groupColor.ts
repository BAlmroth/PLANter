// Pure function, no database: used by the groups service, project creation and the demo seed.
// Kept in its own file so projects.ts can use it without importing groups.ts (which imports projects.ts).

// The color for a new group when none was chosen: the first one no group in the project has yet.
// When all are taken, it starts over (the 9th group gets the 1st color again).
export function pickGroupColor(allowed: string[], usedColors: string[]): string {
  const color = allowed.find((c) => !usedColors.includes(c)) ?? allowed[usedColors.length % allowed.length];
  // Only possible if a template has no group colors: a mistake in the code, not in the request (500)
  if (!color) throw new Error("The template has no group colors");
  return color;
}
