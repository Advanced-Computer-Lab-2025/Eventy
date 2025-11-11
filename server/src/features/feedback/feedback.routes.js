import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  submitFeedback,
  getEventFeedback,
  getUserEventFeedback,
} from "./feedback.controller.js";

const router = express.Router();

// Submit feedback for a specific event
router.post("/events/:eventId", authMiddleware, submitFeedback);

// Get all feedback for a specific event
router.get("/events/:eventId", getEventFeedback);

// Get the authenticated user's feedback for a specific event
router.get(
  "/events/:eventId/feedback/user",
  authMiddleware,
  getUserEventFeedback
);

export default router;
