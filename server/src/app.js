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
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5000"].filter(
  Boolean
); // Removes undefined values if CLIENT_URL isn't set yet

// Global Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Session middleware for OAuth flow
app.use(
  session({
    secret: process.env.JWT_SECRET || "calendar-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 600000 }, // 10 minutes
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
