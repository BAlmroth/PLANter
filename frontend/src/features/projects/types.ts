export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  template: string;
  createdAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  template: string;
  // Optional starter content ("add the things you already know"), saved together with the project
  items?: { type: string; title: string }[];
  groups?: { name: string }[];
  tasks?: { title: string }[];
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};