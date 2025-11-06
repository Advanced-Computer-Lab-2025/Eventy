import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  submitFeedback,
  getEventFeedback,
  getUserEventFeedback,
} from "./feedback.controller.js";

const router = express.Router();

// Submit feedback for an event
router.post("/", authMiddleware, submitFeedback);

// Get all feedback for an event
router.get("/events/:eventId", getEventFeedback);

// Get user's feedback for a specific event
router.get("/events/:eventId/user", authMiddleware, getUserEventFeedback);

export default router;
