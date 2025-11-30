import Joi from "joi";

export const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be a whole number",
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
  }),
  comment: Joi.string().max(1000).allow("").optional().messages({
    "string.max": "Comment must not exceed 1000 characters",
  }),
}).custom((value, helpers) => {
  const hasRating = typeof value.rating === "number" && value.rating >= 1;
  const hasComment =
    typeof value.comment === "string" && value.comment.trim().length > 0;
  if (!hasRating && !hasComment) {
    return helpers.error("any.custom", {
      message: "Provide at least a rating or a non-empty comment",
    });
  }
  return value;
}, "At least one of rating or comment required");

export const deleteFeedbackCommentSchema = Joi.object({
  feedbackId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Feedback ID must be a valid MongoDB ID.",
    "string.length": "Feedback ID must be 24 characters long.",
    "any.required": "Feedback ID is required.",
  }),
});

export const deleteFeedbackCommentBodySchema = Joi.object({
  deletionReason: Joi.string().max(500).optional(),
});
