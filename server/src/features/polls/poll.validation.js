import Joi from "joi";

export const voteSchema = Joi.object({
  optionId: Joi.string().required().messages({
    "any.required": "Option ID is required",
    "string.base": "Option ID must be a string",
    "string.empty": "Option ID cannot be empty",
  }),
});
export const createBoothConflictPollSchema = Joi.object({
  applicationIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(2)
    .required()
    .messages({
      "array.base": "Application IDs must be an array",
      "array.min": "At least two applications are required to create a poll",
      "any.required": "Application IDs are required",
      "string.pattern.base":
        "Each application ID must be a valid MongoDB ObjectId",
    }),
  question: Joi.string().max(500).allow("").optional().messages({
    "string.max": "Question must not exceed 500 characters",
  }),
});

export const endPollSchema = Joi.object({
  pollId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Poll ID must be a valid MongoDB ObjectId",
      "any.required": "Poll ID is required",
    }),
});
