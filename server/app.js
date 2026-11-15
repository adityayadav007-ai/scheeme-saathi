import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import matchRouter from "./routes/match.js";
import schemesRouter from "./routes/schemes.js";
import healthRouter from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const developmentOriginPattern = /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/;
const vercelProjectOriginPattern =
  /^https:\/\/scheeme-saathi[a-z0-9-]*\.vercel\.app$/;

export function createCorsOriginCallback({
  origins = allowedOrigins,
  production = process.env.NODE_ENV === "production",
  logBlockedOrigin = (origin) =>
    console.warn(`Blocked CORS request from origin: ${origin}`)
} = {}) {
  const normalizedOrigins = new Set(
    origins.map((origin) => origin.trim().replace(/\/+$/, ""))
  );

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, "");
    if (
      normalizedOrigins.has(normalizedOrigin) ||
      vercelProjectOriginPattern.test(normalizedOrigin) ||
      (!production && developmentOriginPattern.test(normalizedOrigin))
    ) {
      callback(null, true);
      return;
    }

    logBlockedOrigin(origin);
    callback(null, false);
  };
}

app.use(cors({ origin: createCorsOriginCallback() }));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  morgan("dev", {
    skip: (request) => request.originalUrl.split("?")[0] === "/api/match"
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.use("/api/health", healthRouter);
app.use("/api/schemes", schemesRouter);
app.use("/api/match", matchRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
