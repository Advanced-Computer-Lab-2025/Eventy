import express from "express";
import verifyToken from "../../middlewares/auth.middleware.js";
import {
  initiateGoogleAuth,
  handleOAuthCallback,
  addEventToCalendar,
  removeEventFromCalendar,
  syncCalendar,
  getCalendarStatus,
  disconnectCalendar,
} from "./calendar.controller.js";

const router = express.Router();

// Initiate Google OAuth flow
router.get("/auth/google", verifyToken, initiateGoogleAuth);

// OAuth2 callback
router.get("/oauth2callback", handleOAuthCallback);

// Add event to user's Google Calendar
router.post("/add-event", verifyToken, addEventToCalendar);

// Remove event from Google Calendar
router.delete("/remove-event/:eventId", verifyToken, removeEventFromCalendar);

// Sync user's calendar
router.post("/sync", verifyToken, syncCalendar);

// Get calendar connection status
router.get("/status", verifyToken, getCalendarStatus);

// Disconnect Google Calendar
router.post("/disconnect", verifyToken, disconnectCalendar);

export default router;
