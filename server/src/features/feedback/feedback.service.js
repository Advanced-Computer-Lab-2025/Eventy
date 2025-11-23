import Feedback from "./feedback.model.js";
import ApiError from "../../utils/ApiError.js";
import { Event } from "../events/event.model.js";

export async function submitFeedbackService(
  user,
  eventId,
  { rating, comment }
) {
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const allowedRoles = ["student", "staff", "ta", "professor"];
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(
      403,
      "Forbidden: you are not allowed to submit feedback"
    );
  }

  const userId = user._id || user.id;

  // Verify the event exists and user attended it
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Only allow feedback for approved or archived events
  if (!["approved", "archived"].includes(event.status)) {
    throw new ApiError(
      403,
      "Forbidden: You can only rate events that have been approved"
    );
  }

  // Check if event has ended (only allow feedback after event completion)
  const now = new Date();
  if (event.endDate && new Date(event.endDate) > now) {
    throw new ApiError(
      403,
      "Forbidden: You can only rate events that have already ended"
    );
  }

  // Check if user is in the attendees list
  const isAttendee = event.attendees.some(
    (attendeeId) => attendeeId.toString() === userId.toString()
  );

  if (!isAttendee) {
    throw new ApiError(
      403,
      "Forbidden: You can only rate events you have attended"
    );
  }

  // Create the feedback document. Unique index on (eventId,userId) may cause 11000
  const feedback = await Feedback.create({
    eventId,
    userId,
    rating,
    comment,
  });

  return feedback;
}

export async function getEventFeedbackService(eventId) {
  const feedback = await Feedback.find({ eventId, deletedAt: null })
    .populate("userId", "firstName lastName email")
    .sort("-createdAt");

  const ratings = feedback.map((f) => f.rating);
  const averageRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;

  return {
    feedback,
    averageRating,
    totalReviews: feedback.length,
  };
}

export async function getUserEventFeedbackService(userId, eventId) {
  const feedback = await Feedback.findOne({
    eventId,
    userId,
    deletedAt: null,
  }).populate("userId", "firstName lastName email");

  return feedback;
}
