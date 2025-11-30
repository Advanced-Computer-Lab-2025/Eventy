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

  // Create the feedback document (single optional rating, single optional comment)
  const feedbackData = { eventId, userId };
  if (typeof rating === "number") feedbackData.rating = rating;
  if (comment && String(comment).trim())
    feedbackData.comment = String(comment).trim();

  const feedback = await Feedback.create(feedbackData);

  return await Feedback.findById(feedback._id).populate(
    "userId",
    "firstName lastName email"
  );
}

export async function getEventFeedbackService(eventId) {
  const feedback = await Feedback.find({ eventId, deletedAt: null })
    .populate("userId", "firstName lastName email")
    .sort("-createdAt");

  const ratings = feedback
    .map((f) => (typeof f.rating === "number" ? f.rating : null))
    .filter((v) => typeof v === "number");
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + (b || 0), 0) / ratings.length
      : 0;

  return {
    feedback,
    averageRating,
    totalReviews: feedback.length,
  };
}

export async function getEventFeedbackServiceAdmin(eventId) {
  const feedback = await Feedback.find({ eventId })
    .populate("userId", "firstName lastName email")
    .sort("-createdAt");

  // Average computed only from non-deleted ratings
  const ratings = feedback
    .filter((f) => f.deletedAt === null)
    .map((f) => (typeof f.rating === "number" ? f.rating : null))
    .filter((v) => typeof v === "number");
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + (b || 0), 0) / ratings.length
      : 0;

  return {
    feedback,
    averageRating,
    totalReviews: feedback.length,
  };
}

export async function getUserEventFeedbackService(userId, eventId) {
  const ratingDoc = await Feedback.findOne({
    eventId,
    userId,
    deletedAt: null,
    rating: { $exists: true },
  }).populate("userId", "firstName lastName email");

  return ratingDoc;
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

  // If feedback has a rating and a comment, clear only the comment
  if (typeof feedback.rating === "number" && feedback.rating >= 1) {
    if (feedback.comment && String(feedback.comment).trim()) {
      // Clear the comment only
      const commentBody = feedback.comment;

      // ✅ Get event BEFORE clearing comment
      const event = await Event.findById(feedback.eventId).select("name");

      feedback.comment = null;
      feedback.commentDeletedAt = new Date();
      await feedback.save();

      // Send email
      const allowedRoles = [
        "student",
        "staff",
        "ta",
        "professor",
        "events_office",
      ];
      const commentAuthor = feedback.userId;

      if (commentAuthor && allowedRoles.includes(commentAuthor.role) && event) {
        try {
          console.log("Attempting to send email to:", commentAuthor.email); // ✅ Add logging
          await sendCommentDeletionWarning({
            userName: `${commentAuthor.firstName} ${commentAuthor.lastName}`,
            userEmail: commentAuthor.email,
            eventName: event.name,
            commentBody: commentBody,
          });
          console.log("Email sent successfully!"); // ✅ Add logging
        } catch (emailError) {
          console.error("Failed to send comment deletion warning:", emailError);
          console.error("Email error details:", emailError.message); // ✅ Add detailed logging
        }
      } else {
        console.log("Email not sent. Conditions:", {
          // ✅ Debug logging
          hasAuthor: !!commentAuthor,
          authorRole: commentAuthor?.role,
          roleAllowed: commentAuthor
            ? allowedRoles.includes(commentAuthor.role)
            : false,
          hasEvent: !!event,
        });
      }

      return {
        _id: feedback._id,
        commentCleared: true,
        message: "Comment cleared, rating retained.",
      };
    } else {
      throw new ApiError(
        400,
        "Cannot delete: feedback is rating only and has no comment."
      );
    }
  }

  // If feedback is comment only (no rating), soft-delete
  if (
    (!feedback.rating || feedback.rating === null) &&
    feedback.comment &&
    String(feedback.comment).trim()
  ) {
    const commentBody = feedback.comment;

    // ✅ Get event BEFORE soft-deleting
    const event = await Event.findById(feedback.eventId).select("name");

    feedback.deletedAt = new Date();
    await feedback.save();

    // Send email
    const allowedRoles = [
      "student",
      "staff",
      "ta",
      "professor",
      "events_office",
    ];
    const commentAuthor = feedback.userId;

    if (commentAuthor && allowedRoles.includes(commentAuthor.role) && event) {
      try {
        console.log("Attempting to send email to:", commentAuthor.email); // ✅ Add logging
        await sendCommentDeletionWarning({
          userName: `${commentAuthor.firstName} ${commentAuthor.lastName}`,
          userEmail: commentAuthor.email,
          eventName: event.name,
          commentBody: commentBody,
        });
        console.log("Email sent successfully!"); // ✅ Add logging
      } catch (emailError) {
        console.error("Failed to send comment deletion warning:", emailError);
        console.error("Email error details:", emailError.message); // ✅ Add detailed logging
      }
    }

    return {
      _id: feedback._id,
      commentSoftDeleted: true,
      message: "Comment-only feedback soft-deleted.",
    };
  }

  // If feedback is rating only (no comment), do not allow deletion
  if (
    typeof feedback.rating === "number" &&
    feedback.rating >= 1 &&
    (!feedback.comment || !String(feedback.comment).trim())
  ) {
    throw new ApiError(
      400,
      "Cannot delete: feedback is rating only and has no comment."
    );
  }

  // If feedback is already deleted
  if (feedback.deletedAt) {
    throw new ApiError(400, "Feedback already deleted.");
  }

  throw new ApiError(400, "Invalid feedback state for deletion.");
}
