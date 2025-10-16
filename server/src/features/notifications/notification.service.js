import Notification from "./notification.model.js";

class NotificationService {
  static async getNotificationsByUserId(userId) {
    return Notification.find({ recipient: userId }).sort({ createdAt: -1 });
  }
}

export default NotificationService;
