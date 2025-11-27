import Notification from "./notification.model.js";
import { User } from "../users/user.model.js";

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

  /**
   * Sends notifications to all users about a new event
   * @param {Object} event - The newly created event
   * @param {string} eventType - The type of event (e.g., 'bazaar', 'workshop', 'trip', 'conference')
   */
  static async notifyNewEvent(event, eventType) {
    try {
      // Get all users who should be notified
      const users = await User.find({
        role: { $in: ["student", "staff", "ta", "professor", "events_office"] },
        status: "active",
        notificationPreferences: { $ne: false }, // Only users who haven't opted out
      }).select("_id");

      if (!users.length) return;

      // Map event type to a user-friendly name
      const eventTypeNames = {
        bazaar: "Bazaar",
        workshop: "Workshop",
        trip: "Trip",
        conference: "Conference",
        platform_booth: "Platform Booth",
      };

      // Create notification data
      const notificationData = {
        title: `New ${eventTypeNames[eventType] || "Event"} Added`,
        message: `A new ${eventTypeNames[eventType] || "event"} "${event.name}" has been added.`,
        link: `/events/${event._id}`,
        recipients: users.map((user) => user._id),
        event: event._id,
        notificationType: "new_event",
      };

      // Create notification
      await NotificationService.createNotification(notificationData);

      console.warn(
        `Notification sent to ${users.length} users about new ${eventType}`
      );
    } catch (error) {
      console.error("Error sending event notification:", error);
      // Don't throw error to not block event creation
    }
  }

  /**
   * Sends notifications to specific user roles about a new event
   * @param {Object} event - The newly created event
   * @param {string[]} roles - Array of role names to notify
   * @param {Object} customMessage - Optional custom message object with title and message
   */
  static async notifySpecificRoles(event, roles, customMessage = null) {
    try {
      const users = await User.find({
        role: { $in: roles },
        status: "active",
        notificationPreferences: { $ne: false },
      }).select("_id");

      if (!users.length) return;

      const notificationData = {
        title: customMessage?.title || `New ${event.eventType} Available`,
        message:
          customMessage?.message ||
          `A new ${event.eventType} "${event.name}" is now available.`,
        link: `/events/${event._id}`,
        recipients: users.map((user) => user._id),
        event: event._id,
        notificationType: "event_update",
      };

      await NotificationService.createNotification(notificationData);
    } catch (error) {
      console.error("Error sending role-specific notification:", error);
    }
  }
}

export default NotificationService;
