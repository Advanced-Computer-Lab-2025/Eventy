import { User } from "../users/user.model.js";
import NotificationService from "../notifications/notification.service.js";

/**
 * Sends notifications to all users about a new event
 * @param {Object} event - The newly created event
 * @param {string} eventType - The type of event (e.g., 'bazaar', 'workshop', 'trip', 'conference')
 */
export async function notifyNewEvent(event, eventType) {
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

    console.log(
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
 * @param {string} customMessage - Optional custom message
 */
export async function notifySpecificRoles(event, roles, customMessage = null) {
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
