import { google } from "googleapis";
import dotenv from "dotenv";
import { calendarLogger as logger } from "../../utils/logger.js";

dotenv.config();

const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  (process.env.NODE_ENV === "production"
    ? null
    : "http://localhost:4000/api/calendar/oauth2callback");

if (process.env.NODE_ENV === "production" && !redirectUri) {
  // In production we must know the public callback URL.
  // (The server cannot reliably infer its public origin on Azure without an explicit env var.)
  throw new Error(
    "Missing GOOGLE_REDIRECT_URI in production. Set GOOGLE_REDIRECT_URI=https://<YOUR_BACKEND_ORIGIN>/api/calendar/oauth2callback"
  );
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

/**
 * Generate Google OAuth2 authorization URL
 */
export const getAuthUrl = () => {
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent screen to get refresh token
  });
};

/**
 * Exchange authorization code for tokens
 */
export const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    logger.error("Failed to get OAuth tokens:", error);
    throw error;
  }
};

/**
 * Set credentials for the OAuth2 client
 */
export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/**
 * Add event to user's Google Calendar
 */
export const addEventToGoogleCalendar = async (tokens, eventDetails) => {
  try {
    setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Combine date and time properly to match database exactly
    const getDateTime = (date, time) => {
      if (!time) {
        // If no separate time field, use the date as-is
        return new Date(date).toISOString();
      }

      // Parse the date to get year, month, day (in local timezone)
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth(); // 0-indexed
      const day = dateObj.getDate();

      // Parse time (format: "HH:MM" or "HH:MM:SS")
      const timeParts = time.split(":").map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;

      // Create new date with specific date and time components
      // Using local timezone to match database storage
      const combinedDate = new Date(year, month, day, hours, minutes, seconds);

      return combinedDate.toISOString();
    };

    const event = {
      summary: eventDetails.name || eventDetails.summary,
      location: eventDetails.location || "TBD",
      description: eventDetails.description || "",
      start: {
        dateTime: getDateTime(eventDetails.startDate, eventDetails.startTime),
        timeZone: "Africa/Cairo", // Adjust to your timezone
      },
      end: {
        dateTime: getDateTime(eventDetails.endDate, eventDetails.endTime),
        timeZone: "Africa/Cairo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
      colorId: "9", // Blue color for events
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    logger.error("Failed to add event to Google Calendar:", error);
    throw error;
  }
};

/**
 * Update event in Google Calendar
 */
export const updateGoogleCalendarEvent = async (
  tokens,
  googleEventId,
  eventDetails
) => {
  try {
    setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Combine date and time properly to match database exactly
    const getDateTime = (date, time) => {
      if (!time) {
        return new Date(date).toISOString();
      }

      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();

      const timeParts = time.split(":").map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;

      const combinedDate = new Date(year, month, day, hours, minutes, seconds);
      return combinedDate.toISOString();
    };

    const event = {
      summary: eventDetails.name || eventDetails.summary,
      location: eventDetails.location || "TBD",
      description: eventDetails.description || "",
      start: {
        dateTime: getDateTime(eventDetails.startDate, eventDetails.startTime),
        timeZone: "Africa/Cairo",
      },
      end: {
        dateTime: getDateTime(eventDetails.endDate, eventDetails.endTime),
        timeZone: "Africa/Cairo",
      },
    };

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: googleEventId,
      resource: event,
      sendUpdates: "all",
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    logger.error("Failed to update Google Calendar event:", error);
    throw error;
  }
};

/**
 * Delete event from Google Calendar
 */
export const deleteGoogleCalendarEvent = async (tokens, googleEventId) => {
  try {
    setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
      sendUpdates: "all",
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete Google Calendar event:", error);
    throw error;
  }
};

/**
 * Get user's calendar events (optional - for syncing)
 */
export const getUserCalendarEvents = async (tokens, timeMin, timeMax) => {
  try {
    setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    logger.error("Failed to get calendar events:", error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    logger.error("Failed to refresh Google OAuth access token:", error);
    throw error;
  }
};
