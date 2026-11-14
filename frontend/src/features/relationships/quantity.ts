// Amounts on connections, for example 20 in "House 2 made from 20 × Wood".
// Only relationship types with hasQuantity in the template have them (in the game template:
// "made from" and "costs"). The web template has none, so none of this shows there.

// Same limits as the backend (quantitySchema): a whole number from 1 to 9999
export const MAX_QUANTITY = 9999;

// Reads the amount field. An empty field means "no amount" (undefined), which is always fine.
export function parseQuantity(text: string): { value: number | undefined } | { error: string } {
  const trimmed = text.trim();
  if (trimmed === "") return { value: undefined };
  // Only digits: rejects "1.5", "-3", "2e3" and "20 wood"
  if (!/^\d+$/.test(trimmed)) return { error: "The amount must be a whole number." };
  const value = Number(trimmed);
  if (value < 1 || value > MAX_QUANTITY) return { error: `The amount must be between 1 and ${MAX_QUANTITY}.` };
  return { value };
}

// How the other item is shown in a connection, with its amount if there is one.
// From the item that needs it, the amount comes first: "made from: 20 × Wood".
// From the other side, it comes after: "ingredient in: House 2 (20)".
export function connectionText(connection: {
  otherTitle: string;
  amount?: { value: number; isSource: boolean };
}): string {
  const { otherTitle, amount } = connection;
  if (!amount) return otherTitle;
  return amount.isSource ? `${amount.value} × ${otherTitle}` : `${otherTitle} (${amount.value})`;
}

// The text on a line on the map: the connection's wording, plus the amount if there is one.
// "ingredient in (20)" on the line from Wood to House 2. Without an amount, only the wording.
export function edgeLabel(label: string, quantity: number | null | undefined): string {
  return quantity == null ? label : `${label} (${quantity})`;
}
