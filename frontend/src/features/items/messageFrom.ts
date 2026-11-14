import { ApiError } from "../../lib/api";

// The text to show for an error from the API. Anything else gets a general message.
export const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");
