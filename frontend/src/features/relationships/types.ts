// The shape of what the relationship routes return
export type Relationship = {
  id: string;
  projectId: string;
  sourceItemId: string;
  targetItemId: string;
  type: string; // template key, for example "belongs_to"
};

export type CreateRelationshipInput = {
  sourceItemId: string;
  targetItemId: string;
  type: string;
};
