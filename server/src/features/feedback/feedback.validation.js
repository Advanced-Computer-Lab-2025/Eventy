import Joi from "joi";

export const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be a whole number",
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "any.required": "Rating is required",
  }),
  comment: Joi.string().max(1000).allow("").optional().messages({
    "string.max": "Comment must not exceed 1000 characters",
  }),
});
