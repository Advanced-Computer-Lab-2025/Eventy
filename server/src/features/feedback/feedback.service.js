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

export async function deleteCommentByAdmin(
  adminId,
  feedbackId,
  commentId,
  deletionReason
) {
  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(adminId) ||
    !mongoose.Types.ObjectId.isValid(feedbackId) ||
    !mongoose.Types.ObjectId.isValid(commentId)
  ) {
    throw new ApiError(400, "Invalid adminId, feedbackId, or commentId.");
  }

  // Ensure caller is an admin (populate name/email for notifications)
  const admin = await User.findById(adminId).select(
    "role firstName lastName email"
  );
  if (!admin) {
    throw new ApiError(401, "Admin user not found.");
  }
  if (admin.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Load feedback document with populated user data and comments' authors
  const feedback = await Feedback.findById(feedbackId)
    .populate("userId", "firstName lastName email role")
    .populate("comments.userId", "firstName lastName email role");

  if (!feedback) {
    throw new ApiError(404, "Feedback not found.");
  }

  // Get the event details for the email (safe lookup)
  const event = await Event.findById(feedback.eventId).select("name").lean();
  const eventName = event?.name ?? "the event";

  // Ensure comments array exists
  const comments = Array.isArray(feedback.comments) ? feedback.comments : [];
  if (comments.length === 0) {
    throw new ApiError(404, "No comments found for this feedback.");
  }

  // Find comment using mongoose subdocument helper if available
  let comment =
    typeof feedback.comments.id === "function"
      ? feedback.comments.id(commentId)
      : comments.find((c) => c._id && c._id.toString() === commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found on this feedback.");
  }

  // Prevent double-deletion
  if (comment.deletedAt) {
    throw new ApiError(400, "Comment already deleted.");
  }

  // Get comment author details (may already be populated)
  let commentAuthor = null;
  if (
    comment.userId &&
    typeof comment.userId === "object" &&
    comment.userId.email
  ) {
    commentAuthor = comment.userId;
  } else if (comment.userId) {
    commentAuthor = await User.findById(comment.userId).select(
      "firstName lastName email role"
    );
  }

  // Store comment body before deletion for email
  const commentBody = comment.body ?? "";

  // Soft-delete only the comment (do not remove whole feedback)
  comment.deletedAt = new Date();
  if ("status" in comment) comment.status = "deleted";

  // Persist changes
  await feedback.save();

  // Send warning email to comment author if they have allowed roles
  const allowedRoles = ["student", "staff", "ta", "professor", "events_office"];
  if (
    commentAuthor &&
    commentAuthor.email &&
    allowedRoles.includes((commentAuthor.role ?? "").toLowerCase())
  ) {
    (async () => {
      try {
        await sendCommentDeletionWarning({
          userName:
            `${commentAuthor.firstName ?? ""} ${commentAuthor.lastName ?? ""}`.trim() ||
            "User",
          userEmail: commentAuthor.email,
          eventName,
          commentBody,
          deletionReason: deletionReason || "inappropriate content",
        });
      } catch (emailError) {
        // log but do not fail the request
        console.error(
          "Failed to send comment deletion warning email:",
          emailError
        );
      }
    })();
  }

  // Return minimal sanitized info about deleted comment
  return {
    _id: comment._id,
    deletedAt: comment.deletedAt,
    status: comment.status ?? "deleted",
  };
}
