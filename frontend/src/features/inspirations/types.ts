// The shape of what the inspiration routes return
export type Inspiration = {
  id: string;
  projectId: string;
  title: string;
  url: string | null;
  text: string | null;
  // A temporary link to the image (stops working after about an hour), or null if there is no image
  imageUrl: string | null;
  createdAt: string;
};

// url and text are left out when empty
export type InspirationInput = {
  title: string;
  url?: string;
  text?: string;
};
