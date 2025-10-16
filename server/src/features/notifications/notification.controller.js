import NotificationService from "./notification.service.js";

class NotificationController {
  static async getAllNotificationsByUserId(req, res) {
    try {
      // Get userId from the authenticated user (set by authMiddleware)
      const userId = req.user && (req.user.id || req.user._id);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: user id not found" });
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
}

export default NotificationController;
