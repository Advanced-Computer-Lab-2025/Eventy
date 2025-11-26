import Feedback from "./feedback.model.js";
import ApiError from "../../utils/ApiError.js";
import { Event } from "../events/event.model.js";
import mongoose from "mongoose";
import * as UserModule from "../users/user.model.js";
import { sendCommentDeletionWarning } from "../auth/email.service.js";
const User = UserModule.default ?? UserModule.User ?? UserModule;

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

  // Create the feedback document. store comment (if provided) as a subdocument
  const feedbackData = {
    eventId,
    userId,
    rating,
    comments: [],
  };

  if (comment && comment.trim()) {
    feedbackData.comments.push({
      userId,
      body: comment.trim(),
    });
  }

  const feedback = await Feedback.create(feedbackData);

  // return populated feedback for consistency with other endpoints
  return await Feedback.findById(feedback._id)
    .populate("userId", "firstName lastName email")
    .populate("comments.userId", "firstName lastName email");
}

export async function getEventFeedbackService(eventId) {
  const feedback = await Feedback.find({ eventId, deletedAt: null })
    .populate("userId", "firstName lastName email")
    .populate("comments.userId", "firstName lastName email")
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
  })
    .populate("userId", "firstName lastName email")
    .populate("comments.userId", "firstName lastName email");

  return feedback;
}

export async function deleteCommentByAdmin(adminId, feedbackId) {
  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(adminId) ||
    !mongoose.Types.ObjectId.isValid(feedbackId)
  ) {
    throw new ApiError(400, "Invalid adminId or feedbackId.");
  }

  // Ensure caller is an admin
  const admin = await User.findById(adminId).select("role");
  if (!admin) {
    throw new ApiError(401, "Admin user not found.");
  }
  if (admin.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Load feedback with user data
  const feedback = await Feedback.findById(feedbackId).populate(
    "userId",
    "firstName lastName email role"
  );

  if (!feedback) {
    throw new ApiError(404, "Feedback not found.");
  }

  // Check if comment exists and not already deleted
  if (!feedback.comment || !feedback.comment.trim()) {
    throw new ApiError(404, "No comment found for this feedback.");
  }

  // Get event details
  const event = await Event.findById(feedback.eventId).select("name");
  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Store comment before deletion
  const commentBody = feedback.comment;
  const commentAuthor = feedback.userId;

  // Delete the comment (clear the field)
  feedback.comment = "";

  // Update the type field based on what remains
  if (feedback.rating) {
    // If rating exists, change type to "rating"
    feedback.type = "rating";
  } else {
    // If no rating, soft-delete entire feedback
    feedback.deletedAt = new Date();
  }

  await feedback.save();

  // Send warning email
  const allowedRoles = ["student", "staff", "ta", "professor", "events_office"];
  if (commentAuthor && allowedRoles.includes(commentAuthor.role)) {
    try {
      await sendCommentDeletionWarning({
        userName: `${commentAuthor.firstName} ${commentAuthor.lastName}`,
        userEmail: commentAuthor.email,
        eventName: event.name,
        commentBody: commentBody,
        deletionReason: "inappropriate content", // Default reason for deletion
      });
    } catch (emailError) {
      console.error("Failed to send comment deletion warning:", emailError);
    }
  }

  return {
    _id: feedback._id,
    commentDeleted: true,
    message: "Comment successfully deleted",
  };
}
