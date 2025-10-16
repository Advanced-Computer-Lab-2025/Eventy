import express from "express";
import NotificationController from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

// Allow all roles to access notifications
const allRoles = [
  "student",
  "staff",
  "events_office",
  "ta",
  "professor",
  "admin",
  "vendor",
];

// GET /api/notifications/me
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(allRoles),
  NotificationController.getAllNotificationsByUserId
);

export default router;
