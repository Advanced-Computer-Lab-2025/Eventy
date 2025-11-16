import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import WorkshopSubmission from "./src/config/workshopSchema";

const router = express.Router();

// API endpoint to get workshop submission status and requested edits
router.get("/workshops/:professorId", async (req, res) => {
  try {
    const { professorId } = req.params;
    const submissions = await WorkshopSubmission.find({ professorId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions", error });
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register the workshop routes with /api prefix
  app.use("/api", router);

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
