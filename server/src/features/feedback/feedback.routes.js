import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import {
  submitFeedback,
  getEventFeedback,
  getUserEventFeedback,
} from "./feedback.controller.js";

const router = express.Router();

// Submit feedback for a specific event
router.post(
  "/events/:eventId",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  submitFeedback
);

// Get all feedback for a specific event
router.get(
  "/events/:eventId",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  getEventFeedback
);

// Get the authenticated user's feedback for a specific event
router.get(
  "/events/:eventId/feedback/user",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  getUserEventFeedback
);

export default router;
