// The shape of what the item detail routes return. A row is a link (url, no image)
// or a visual reference (with an image): the item's moodboard.
// Named ItemDetailRow because ItemDetail is already the item page component.
export type ItemDetailRow = {
  id: string;
  itemId: string;
  title: string;
  url: string | null;
  text: string | null;
  // A temporary link to the image (stops working after about an hour), or null if there is no image
  imageUrl: string | null;
  createdAt: string;
};

// url and text are left out when empty
export type ItemDetailInput = {
  title: string;
  url?: string;
  text?: string;
};
