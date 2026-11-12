// A color in the project's palette
export type ProjectColor = {
  id: string;
  projectId: string;
  // Always "#RRGGBB" in upper case
  hex: string;
  name: string | null;
  createdAt: string;
};

// name is left out when empty
export type ColorInput = {
  hex: string;
  name?: string;
};

// One palette color used by one item
export type ItemColorLink = {
  itemId: string;
  colorId: string;
};
