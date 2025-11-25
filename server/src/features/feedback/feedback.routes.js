import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  submitFeedback,
  getEventFeedback,
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
  // allow admins here as well
  roleMiddleware(["student", "staff", "ta", "professor", "admin"]),
  getEventFeedback
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
