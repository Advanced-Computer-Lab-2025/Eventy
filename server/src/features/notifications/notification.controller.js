import NotificationService from "./notification.service.js";
import {
  createNotificationSchema,
  updateNotificationSchema,
} from "./notification.validation.js";

class NotificationController {
  static async getAllNotificationsByUserId(req, res) {
    try {
      const userId = req.user && (req.user.id || req.user._id);
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: user id not found" });
      }
      const notifications = await NotificationService.getNotificationsByUserId(
        userId
      );
      res.json({ success: true, data: notifications });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }

  static async createNotification(req, res) {
    try {
      const { error, value } = createNotificationSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }

      // Create a single notification with all recipients
      const notification = await NotificationService.createNotification(value);

      res.status(201).json({ success: true, data: notification });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }

  static async updateNotification(req, res) {
    try {
      const { error, value } = updateNotificationSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }
      const notificationId = req.params.id;
      const updated = await NotificationService.updateNotification(
        notificationId,
        value
      );
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }

  // Soft delete: set deletedAt to now
  static async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;
      const deleted = await NotificationService.softDeleteNotification(
        notificationId
      );
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, data: deleted });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
}

export default NotificationController;
