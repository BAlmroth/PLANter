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
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};