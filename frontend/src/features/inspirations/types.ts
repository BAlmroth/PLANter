// The shape of what the inspiration routes return
export type Inspiration = {
  id: string;
  projectId: string;
  title: string;
  url: string | null;
  text: string | null;
  createdAt: string;
};

// url and text are left out when empty
export type InspirationInput = {
  title: string;
  url?: string;
  text?: string;
};
