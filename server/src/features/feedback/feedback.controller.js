import {
  submitFeedbackService,
  getEventFeedbackService,
  getUserEventFeedbackService,
} from "./feedback.service.js";
import ApiError from "../../utils/ApiError.js";

// Submit feedback for an event (delegates to service)
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    const feedback = await submitFeedbackService(req.user, eventId, {
      rating,
      comment,
    });

    return res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    // Duplicate key (user already submitted feedback)
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event",
      });
    }

    if (error instanceof ApiError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all feedback for an event (delegates to service)
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await getEventFeedbackService(eventId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get feedback by current user for an event (delegates to service)
export const getUserEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user && (req.user._id || req.user.id);

    const feedback = await getUserEventFeedbackService(userId, eventId);

    return res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};
