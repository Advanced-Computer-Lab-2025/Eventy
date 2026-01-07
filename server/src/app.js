import logger from "./utils/logger.js";
import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";
import allRoutes from "./routes/index.js";

import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// 1. Setup CORS before anything else
// Since you haven't deployed the frontend yet,
// we add localhost so you can still test locally.
const isProd = process.env.NODE_ENV === "production";

const envAllowed = [process.env.CLIENT_URL, process.env.CLIENT_ORIGIN]
  .filter(Boolean)
  .flatMap((v) => String(v).split(","))
  .map((v) => v.trim())
  .filter(Boolean);

const allowVercelPreviews =
  String(process.env.ALLOW_VERCEL_PREVIEWS || "").toLowerCase() === "true";

const vercelProjectSlug = (() => {
  const candidate = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN;
  if (!candidate) return null;
  const first = String(candidate).split(",")[0]?.trim();
  if (!first) return null;

  try {
    const { hostname } = new URL(first);
    if (!hostname.endsWith(".vercel.app")) return null;
    return hostname.replace(/\.vercel\.app$/i, "");
  } catch {
    return null;
  }
})();

const allowedOrigins = [
  ...envAllowed,
  ...(isProd ? [] : ["http://localhost:5000"]),
].filter(Boolean);

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      if (vercelProjectSlug) {
        try {
          const { hostname, protocol } = new URL(origin);
          if (
            protocol === "https:" &&
            hostname.endsWith(".vercel.app") &&
            (hostname === `${vercelProjectSlug}.vercel.app` ||
              hostname.startsWith(`${vercelProjectSlug}-`))
          ) {
            return callback(null, true);
          }
        } catch {
          // ignore invalid origin
        }
      }

      if (allowVercelPreviews) {
        try {
          const { hostname, protocol } = new URL(origin);
          if (protocol === "https:" && hostname.endsWith(".vercel.app")) {
            return callback(null, true);
          }
        } catch {
          // ignore invalid origin
        }
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Session middleware for OAuth flow
app.use(
  session({
    secret: process.env.JWT_SECRET || "calendar-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 600000,
    },
  })
);

app.use(express.json()); // Parse JSON request bodies

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    logger.info("Body:", req.body);
  }
  next();
});

// Mount all API routes from routes/index.js under the /api path
app.use("/api", allRoutes);

// Global Error Handler Middleware
app.use(errorMiddleware);

export default app;
