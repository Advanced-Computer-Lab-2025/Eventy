import Notification from "./notification.model.js";

class NotificationService {
  /**
   * Get all notifications where the user is a recipient.
   * @param {string} userId - The user's ObjectId as a string.
   * @returns {Promise<Array>} Array of notification documents.
   */
  static async getNotificationsByUserId(userId) {
    return Notification.find({ recipients: { $in: [userId] } }).sort({
      createdAt: -1,
    });
  }

  /**
   * Create a new notification document.
   * @param {Object} data - Notification data (should include recipients array).
   * @returns {Promise<Object>} The created notification document.
   */
  static async createNotification(data) {
    return Notification.create(data);
  }

  /**
   * Update a notification by its ID.
   * @param {string} notificationId
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  static async updateNotification(notificationId, updateData) {
    return Notification.findByIdAndUpdate(notificationId, updateData, {
      new: true,
    });
  }
}

export default NotificationService;
