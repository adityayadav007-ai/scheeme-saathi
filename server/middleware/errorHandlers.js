import { ZodError } from "zod";

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Request validation failed",
        details: error.issues.map(({ path, message }) => ({
          path: path.join("."),
          message
        }))
      }
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  const errorDetails = {
    message: status >= 500 ? "Internal server error" : error.message
  };
  if (status >= 500 && process.env.NODE_ENV !== "production") {
    errorDetails.stack = error.stack;
  }
  return res.status(status).json({
    error: errorDetails
  });
}
