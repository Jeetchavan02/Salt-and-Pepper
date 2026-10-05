import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
  code?: number | string;
}

/**
 * Centralised Express error handler.
 * All unhandled errors bubble up here via next(err).
 * Never exposes stack traces or sensitive info to clients.
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log full error on server (dev only)
  if (process.env.NODE_ENV !== "production") {
    console.error("❌  Unhandled error:", err);
  }

  const status = err.status ?? 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred"
      : err.message ?? "Unknown error";

  res.status(status).json({ success: false, message });
}
