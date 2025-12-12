import {
  getAuthUrl,
  getTokensFromCode,
  addEventToGoogleCalendar,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getUserCalendarEvents,
  refreshAccessToken,
} from "./calendar.service.js";
import { User } from "../users/user.model.js";
import { Event } from "../events/event.model.js";

/**
 * Initiate Google OAuth flow
 */
export const initiateGoogleAuth = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const authUrl = getAuthUrl();

    // Store user ID in session for callback
    if (req.session) {
      req.session.userId = req.user._id.toString();
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Also include userId in the state parameter as backup
    const authUrlWithState = `${authUrl}&state=${req.user._id.toString()}`;

    res.json({
      success: true,
      authUrl: authUrlWithState,
    });
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate authentication",
      error: error.message,
    });
  }
};

/**
 * Handle OAuth2 callback
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    // Try to get userId from session first, fallback to state parameter
    let userId = req.session?.userId || state;

    if (!code) {
      return res.redirect("http://localhost:5000/?calendar_error=no_code");
    }

    if (!userId) {
      return res.redirect("http://localhost:5000/?calendar_error=no_session");
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Save tokens to user document
    await User.findByIdAndUpdate(userId, {
      googleCalendarTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      calendarConnected: true,
    });

    // Clear session
    if (req.session?.userId) {
      delete req.session.userId;
    }

    // Redirect to Eventy root with success indicator
    res.redirect("http://localhost:5000/?calendar_connected=true");
  } catch (error) {
    console.error("Error handling OAuth callback:", error);
    res.redirect("http://localhost:5000/?calendar_error=auth_failed");
  }
};

/**
 * Add event to user's Google Calendar
 */
export const addEventToCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    // Get user and check if calendar is connected
    const user = await User.findById(userId);
    if (!user || !user.calendarConnected || !user.googleCalendarTokens) {
      return res.status(400).json({
        success: false,
        message: "Google Calendar not connected",
      });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if token needs refresh
    let tokens = user.googleCalendarTokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      tokens = await refreshAccessToken(tokens.refresh_token);
      await User.findByIdAndUpdate(userId, {
        googleCalendarTokens: tokens,
      });
    }

    // Add event to Google Calendar
    const result = await addEventToGoogleCalendar(tokens, {
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
    });

    // Save Google Calendar event ID to event document
    await Event.findByIdAndUpdate(eventId, {
      $push: {
        googleCalendarEvents: {
          userId,
          googleEventId: result.eventId,
          htmlLink: result.htmlLink,
        },
      },
    });

    res.json({
      success: true,
      message: "Event added to Google Calendar",
      data: result,
    });
  } catch (error) {
    console.error("Error adding event to calendar:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add event to calendar",
      error: error.message,
    });
  }
};

/**
 * Remove event from Google Calendar
 */
export const removeEventFromCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.calendarConnected || !user.googleCalendarTokens) {
      return res.status(400).json({
        success: false,
        message: "Google Calendar not connected",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Find user's Google Calendar event ID
    const googleCalendarEvent = event.googleCalendarEvents?.find(
      (gce) => gce.userId.toString() === userId.toString()
    );

    if (!googleCalendarEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found in Google Calendar",
      });
    }

    // Check if token needs refresh
    let tokens = user.googleCalendarTokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      tokens = await refreshAccessToken(tokens.refresh_token);
      await User.findByIdAndUpdate(userId, {
        googleCalendarTokens: tokens,
      });
    }

    // Delete from Google Calendar
    await deleteGoogleCalendarEvent(tokens, googleCalendarEvent.googleEventId);

    // Remove from event document
    await Event.findByIdAndUpdate(eventId, {
      $pull: {
        googleCalendarEvents: { userId },
      },
    });

    res.json({
      success: true,
      message: "Event removed from Google Calendar",
    });
  } catch (error) {
    console.error("Error removing event from calendar:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove event from calendar",
      error: error.message,
    });
  }
};

/**
 * Sync all registered events to Google Calendar
 */
export const syncCalendar = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || !user.calendarConnected || !user.googleCalendarTokens) {
      return res.status(400).json({
        success: false,
        message: "Google Calendar not connected",
      });
    }

    // Get all events user is registered for
    const events = await Event.find({
      attendees: userId,
      startDate: { $gte: new Date() }, // Only future events
    });

    let tokens = user.googleCalendarTokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      tokens = await refreshAccessToken(tokens.refresh_token);
      await User.findByIdAndUpdate(userId, {
        googleCalendarTokens: tokens,
      });
    }

    const results = [];
    let syncedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      try {
        // Check if already synced for this specific user
        const alreadySynced = event.googleCalendarEvents?.some(
          (gce) => gce.userId && gce.userId.toString() === userId.toString()
        );

        if (alreadySynced) {
          console.log(`Event ${event.name} already synced for user ${userId}`);
          skippedCount++;
          results.push({
            eventId: event._id,
            eventName: event.name,
            status: "already_synced",
          });
          continue;
        }

        // Add event to Google Calendar
        console.log(`Syncing event ${event.name} for user ${userId}`);
        const result = await addEventToGoogleCalendar(tokens, {
          name: event.name,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
        });

        // Save Google Calendar event ID to event document
        await Event.findByIdAndUpdate(event._id, {
          $push: {
            googleCalendarEvents: {
              userId,
              googleEventId: result.eventId,
              htmlLink: result.htmlLink,
            },
          },
        });

        syncedCount++;
        results.push({
          eventId: event._id,
          eventName: event.name,
          status: "synced",
          googleEventId: result.eventId,
        });
      } catch (error) {
        console.error(`Failed to sync event ${event.name}:`, error.message);
        results.push({
          eventId: event._id,
          eventName: event.name,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Calendar sync completed. ${syncedCount} new events synced, ${skippedCount} already synced.`,
      data: {
        totalEvents: events.length,
        syncedCount,
        skippedCount,
        results,
      },
    });
  } catch (error) {
    console.error("Error syncing calendar:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync calendar",
      error: error.message,
    });
  }
};

/**
 * Get calendar connection status
 */
export const getCalendarStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        connected: user?.calendarConnected || false,
        hasTokens: !!user?.googleCalendarTokens?.access_token,
      },
    });
  } catch (error) {
    console.error("Error getting calendar status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get calendar status",
      error: error.message,
    });
  }
};

/**
 * Disconnect Google Calendar
 */
export const disconnectCalendar = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $unset: { googleCalendarTokens: "" },
      calendarConnected: false,
    });

    res.json({
      success: true,
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect calendar",
      error: error.message,
    });
  }
};
