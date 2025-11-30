import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  submitFeedback,
  getEventFeedback,
  getEventFeedbackAll,
  getUserEventFeedback,
  deleteFeedbackCommentByAdmin,
} from "./feedback.controller.js";
import { deleteFeedbackCommentSchema } from "./feedback.validation.js";

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
  // Allow all users to view all feedback for moderation/reporting
  roleMiddleware([
    "student",
    "staff",
    "ta",
    "professor",
    "admin",
    "events_office",
  ]),
  getEventFeedback
);

// Get all feedback for a specific event INCLUDING soft-deleted entries (admin/events_office only)
router.get(
  "/events/:eventId/all",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  getEventFeedbackAll
);

// Get the authenticated user's feedback for a specific event
router.get(
  "/events/:eventId/me",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor", "admin"]),
  getUserEventFeedback
);

// DELETE /api/feedback/:feedbackId/comment
router.delete(
  "/:feedbackId/comment",
  authMiddleware,
  roleMiddleware(["admin"]),
  validate(deleteFeedbackCommentSchema, "params"), // ADD THIS LINE
  deleteFeedbackCommentByAdmin
);

export default router;
