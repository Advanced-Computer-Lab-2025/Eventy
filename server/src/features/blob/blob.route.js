import express from "express";
import { BlobController } from "./blob.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();
const blobController = new BlobController();

// POST /api/blob/upload
router.post(
  "/upload",
  authMiddleware, // Add auth if needed
  blobController.upload.bind(blobController)
);

export default router;

