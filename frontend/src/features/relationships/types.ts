// The shape of what the relationship routes return
export type Relationship = {
  id: string;
  projectId: string;
  sourceItemId: string;
  targetItemId: string;
  type: string; // template key, for example "belongs_to"
  // An amount, for example 20 in "House 2 made from 20 Wood". null = no amount.
  // Optional in the type so test data and older answers without the field still fit.
  quantity?: number | null;
};

export type CreateRelationshipInput = {
  sourceItemId: string;
  targetItemId: string;
  type: string;
  // Only for types with hasQuantity in the template
  quantity?: number;
};

// PATCH /api/relationships/:id: only the amount can change, null removes it
export type UpdateRelationshipInput = {
  quantity: number | null;
};
