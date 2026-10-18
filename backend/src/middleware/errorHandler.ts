import type { ErrorRequestHandler, RequestHandler } from "express";

// An error we throw on purpose, with the HTTP status the client should get.
// Example: throw new HttpError(404, "Project not found")
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Runs when no route matched the request
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Route not found"));
};

// Every error ends up here and is sent in the same shape: { error: { message, details? } }.
// Express knows it is an error handler because it has four parameters, even if _next is unused.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.details === undefined
        ? { message: err.message }
        : { message: err.message, details: err.details },
    });
    return;
  }

  // Invalid JSON in the request body (thrown by express.json()) is the client's mistake
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { message: "Invalid JSON in request body" } });
    return;
  }

  // Anything else is a bug. Log it for us, but don't leak the details to the client
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
