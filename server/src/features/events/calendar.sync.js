import { User } from "../users/user.model.js";
import { Event } from "./event.model.js";
import { google } from "googleapis";

/**
 * Build rich event description with all event details
 */
const buildEventDescription = (event) => {
  // Return only the event description
  return event.description || "";
};

/**
 * Get Google Calendar color ID based on event type
 * Colors: 1=Tomato, 2=Flamingo, 3=Tangerine, 4=Banana, 5=Sage, 6=Basil, 7=Peacock, 8=Blueberry, 9=Lavender, 10=Grape, 11=Graphite
 */
const getColorByEventType = (eventType) => {
  const colorMap = {
    workshop: "5", // Sage - learning/green
    conference: "7", // Peacock - professional/blue
    trip: "3", // Tangerine - fun/orange
    bazaar: "4", // Banana - festive/yellow
    platform_booth: "6", // Basil - booth/dark green
  };
  return colorMap[eventType] || "1"; // Default to Tomato
};

/**
 * Sync event to user's Google Calendar
 * Called automatically when user registers for an event
 */
export const syncEventToGoogleCalendar = async (userId, eventId) => {
  try {
    // Get user and event details
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    // Check if user has calendar connected
    if (!user?.calendarConnected || !user?.googleCalendarTokens?.access_token) {
      return {
        success: false,
        synced: false,
        reason: "Calendar not connected",
      };
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set user's tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.access_token,
      refresh_token: user.googleCalendarTokens.refresh_token,
      expiry_date: user.googleCalendarTokens.expiry_date,
    });

    // Create calendar API instance
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Format event for Google Calendar with ALL details
    // Helper function to combine date and time strings into proper ISO format
    const combineDateAndTime = (dateObj, timeStr) => {
      const date = new Date(dateObj);
      if (timeStr) {
        // Parse time string like "10:00 AM" or "2:30 PM"
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const meridiem = timeMatch[3]?.toUpperCase();

          // Convert to 24-hour format if needed
          if (meridiem === "PM" && hours !== 12) {
            hours += 12;
          } else if (meridiem === "AM" && hours === 12) {
            hours = 0;
          }

          date.setHours(hours, minutes, 0, 0);
        }
      }
      return date.toISOString();
    };

    const googleEvent = {
      summary: event.name || event.title, // Event name/title
      description: buildEventDescription(event), // Rich description with all details
      start: {
        dateTime: combineDateAndTime(event.startDate, event.startTime),
        timeZone: "UTC",
      },
      end: {
        dateTime: combineDateAndTime(event.endDate, event.endTime),
        timeZone: "UTC",
      },
      location: event.location || "TBD",
      reminders: {
        useDefault: true,
      },
      // Add attendees if available
      attendees:
        event.attendees && event.attendees.length > 0
          ? event.attendees
              .map((attendee) => ({
                email: attendee.email || "",
                displayName:
                  `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim(),
              }))
              .filter((a) => a.email)
          : [],
      // Add event type as color for visual distinction
      colorId: getColorByEventType(event.eventType),
    };

    // Insert event into Google Calendar
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: googleEvent,
      sendNotifications: true,
    });

    console.log(
      `✅ Event synced to Google Calendar for user ${userId}: ${response.data.id}`
    );

    return {
      success: true,
      synced: true,
      googleEventId: response.data.id,
    };
  } catch (error) {
    console.error("Calendar sync error:", error.message);

    // Handle token refresh
    if (error.message.includes("invalid_grant")) {
      try {
        await refreshGoogleCalendarToken(userId);
        // Retry sync
        return syncEventToGoogleCalendar(userId, eventId);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError.message);
        return {
          success: false,
          synced: false,
          reason: "Token expired and refresh failed",
        };
      }
    }

    return {
      success: false,
      synced: false,
      reason: error.message,
    };
  }
};

/**
 * Remove event from Google Calendar
 * Called when user cancels registration
 */
export const removeEventFromGoogleCalendar = async (userId, googleEventId) => {
  try {
    if (!googleEventId) {
      return {
        success: false,
        removed: false,
        reason: "No Google event ID",
      };
    }

    const user = await User.findById(userId);

    if (!user?.calendarConnected || !user?.googleCalendarTokens?.access_token) {
      return {
        success: false,
        removed: false,
        reason: "Calendar not connected",
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.access_token,
      refresh_token: user.googleCalendarTokens.refresh_token,
      expiry_date: user.googleCalendarTokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
      sendNotifications: true,
    });

    console.log(
      `✅ Event removed from Google Calendar for user ${userId}: ${googleEventId}`
    );

    return {
      success: true,
      removed: true,
    };
  } catch (error) {
    console.error("Calendar removal error:", error.message);
    return {
      success: false,
      removed: false,
      reason: error.message,
    };
  }
};

/**
 * Refresh Google Calendar access token
 */
export const refreshGoogleCalendarToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user?.googleCalendarTokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleCalendarTokens.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update user with new tokens
    user.googleCalendarTokens = {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expiry_date,
    };

    await user.save();

    console.log(`✅ Calendar token refreshed for user ${userId}`);
    return user;
  } catch (error) {
    console.error("Token refresh error:", error.message);
    throw error;
  }
};
