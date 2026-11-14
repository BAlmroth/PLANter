// The kinds of error page the app can show, and the text for each.
// Pure data and functions (no React), so they can be tested on their own.

export type ErrorKind = "notFound" | "server" | "offline" | "crash" | "unknown";

type ErrorContent = {
  code: string | null; // the big number at the top ("404"), null when there is no HTTP status
  title: string;
  message: string;
};

export const ERROR_CONTENT: Record<ErrorKind, ErrorContent> = {
  notFound: {
    code: "404",
    title: "Page not found",
    // Also used when the thing exists but belongs to someone else (the API answers 404 then too)
    message: "This page doesn't exist, or you don't have access to it.",
  },
  server: {
    code: "500",
    title: "Something went wrong on our side",
    message: "The server had a problem with this request. Try again in a moment.",
  },
  offline: {
    code: null,
    title: "Can't reach the server",
    message: "Check your internet connection and try again.",
  },
  crash: {
    code: null,
    title: "Something went wrong",
    message: "This page stopped working because of an error in PLANter. Reloading the page usually fixes it.",
  },
  unknown: {
    code: null,
    title: "Something went wrong",
    message: "The request could not be completed. Try again in a moment.",
  },
};

// Picks the error page for a status from ApiError.
// 0 = no answer at all (ApiError uses 0 when fetch itself failed).
// 400 counts as not found: on a page load it means the id in the URL is not a valid id.
export function errorKindFromStatus(status: number): ErrorKind {
  if (status === 0) return "offline";
  if (status === 404 || status === 400) return "notFound";
  if (status >= 500) return "server";
  return "unknown";
}
