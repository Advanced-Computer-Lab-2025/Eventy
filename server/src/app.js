import express from "express";
import cors from "cors";
import path from "path";
import allRoutes from "./routes/index.js";
import userRoutes from "./features/users/user.route.js";

import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON request bodies

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    console.log("Body:", req.body);
  }
  next();
});

// Mount all API routes from routes/index.js under the /api path
app.use("/api", allRoutes);

// Global Error Handler Middleware
app.use(errorMiddleware);

export default app;
