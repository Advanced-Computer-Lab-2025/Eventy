import Feedback from "./feedback.model.js";
import mongoose from "mongoose";

// Submit feedback for an event
export const submitFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const userId = req.user._id;

    const feedback = await Feedback.create({
      eventId,
      userId,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all feedback for an event
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    // populate user fields that exist in our User model
    // some users (vendors) have companyName while others have firstName/lastName
    const feedback = await Feedback.find({ eventId })
      .populate("userId", "firstName lastName companyName email")
      .sort("-createdAt");

    // Calculate average rating
    const ratings = feedback.map((f) => f.rating);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;

    return res.status(200).json({
      success: true,
      data: {
        feedback,
        averageRating,
        totalReviews: feedback.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get feedback by current user for an event
export const getUserEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({ eventId, userId }).populate(
      "userId",
      "firstName lastName companyName email"
    );

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
