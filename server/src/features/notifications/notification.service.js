import Notification from "./notification.model.js";

class NotificationService {
  /**
   * Get all notifications where the user is a recipient.
   * Adds computed isRead field based on whether user is in readBy array.
   * @param {string} userId - The user's ObjectId as a string.
   * @returns {Promise<Array>} Array of notification documents with computed isRead field.
   */
  static async getNotificationsByUserId(userId) {
    const notifications = await Notification.find({
      recipients: { $in: [userId] },
      deletedAt: null,
    }).sort({
      createdAt: -1,
    });

    // Add computed isRead field for each notification
    return notifications.map((notification) => {
      const notificationObj = notification.toObject();
      notificationObj.isRead =
        notification.readBy?.some(
          (readUserId) => readUserId.toString() === userId.toString()
        ) || false;
      return notificationObj;
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

  /**
   * Mark a notification as read for a specific user.
   * Adds the user to the readBy array if not already present.
   * @param {string} notificationId - The notification's ObjectId
   * @param {string} userId - The user's ObjectId
   * @returns {Promise<Object|null>} Updated notification with computed isRead field
   */
  static async markAsReadForUser(notificationId, userId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return null;
    }

    // Check if user is already in readBy array
    const isAlreadyRead = notification.readBy?.some(
      (readUserId) => readUserId.toString() === userId.toString()
    );

    if (!isAlreadyRead) {
      // Add user to readBy array
      notification.readBy = notification.readBy || [];
      notification.readBy.push(userId);
      await notification.save();
    }

    // Return notification with computed isRead field
    const notificationObj = notification.toObject();
    notificationObj.isRead = true;
    return notificationObj;
  }

  /**
   * Soft delete a notification by setting deletedAt to now.
   * @param {string} notificationId
   * @returns {Promise<Object|null>}
   */
  static async softDeleteNotification(notificationId) {
    return Notification.findByIdAndUpdate(
      notificationId,
      { deletedAt: new Date() },
      { new: true }
    );
  }
}

export default NotificationService;
