import {
  submitFeedbackService,
  getEventFeedbackService,
  getEventFeedbackServiceAdmin,
  getUserEventFeedbackService,
  deleteCommentByAdmin,
} from "./feedback.service.js";
import ApiError from "../../utils/ApiError.js";
import { submitFeedbackSchema } from "./feedback.validation.js";

// Submit feedback for an event (delegates to service)
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    const { error } = submitFeedbackSchema.validate({ rating, comment });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details?.[0]?.message || error.message,
      });
    }

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
        message: "You have already submitted a rating for this event",
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

// Get all feedback for an event including soft-deleted entries (admin/events_office)
export const getEventFeedbackAll = async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await getEventFeedbackServiceAdmin(eventId);

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

export const deleteFeedbackCommentByAdmin = async (req, res) => {
  try {
    const adminId = req.user && (req.user._id || req.user.id);
    if (!adminId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    const { feedbackId } = req.params; // No commentId needed
    const { deletionReason } = req.body; // Optional reason

    const result = await deleteCommentByAdmin(
      adminId,
      feedbackId,
      deletionReason
    );

    return res.status(200).json({ success: true, data: result });
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
