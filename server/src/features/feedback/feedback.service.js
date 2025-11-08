import Feedback from "./feedback.model.js";
import ApiError from "../../utils/ApiError.js";

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
  const feedback = await Feedback.find({ eventId })
    .populate("userId", "firstName lastName companyName email")
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
  const feedback = await Feedback.findOne({ eventId, userId }).populate(
    "userId",
    "firstName lastName companyName email"
  );

  return feedback;
}
