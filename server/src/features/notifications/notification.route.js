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

// POST /api/notifications
router.post(
  "/",
  authMiddleware,
  roleMiddleware(allRoles),
  NotificationController.createNotification
);

// PATCH /api/notifications/:id
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(allRoles),
  NotificationController.updateNotification
);

// DELETE /api/notifications/:id (soft delete)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(allRoles),
  NotificationController.deleteNotification
);

export default router;
