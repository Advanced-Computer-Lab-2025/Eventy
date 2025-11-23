import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic, log } from "./vite";
// @ts-expect-error - JS module without types
import allRoutes from "./src/routes/index.js";
// @ts-expect-error - cors module without types
import cors from "cors";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CORS configuration
  app.use(
    cors({
      origin: "http://localhost:5000",
      credentials: true,
    })
  );

  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Register all API routes from routes/index.js under the /api path
  // This MUST be done BEFORE Vite's catch-all route to prevent API routes
  // from being intercepted by the frontend router
  console.log("🔵 Registering API routes at /api");
  console.log(
    "🔵 Routes being imported:",
    allRoutes ? "✅ Success" : "❌ Failed"
  );
  app.use("/api", allRoutes);
  console.log("✅ API routes registered successfully");

  // Test route to verify API routes are working
  app.get("/api/test", (req, res) => {
    res.json({
      message: "API routes are working!",
      timestamp: new Date().toISOString(),
    });
  });

  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  app.listen(5000, () => {
    console.log("Server running on: http://localhost:5000");
  });
})();
