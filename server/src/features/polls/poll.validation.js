import Joi from "joi";

export const voteSchema = Joi.object({
  optionId: Joi.string().required().messages({
    "any.required": "Option ID is required",
    "string.base": "Option ID must be a string",
    "string.empty": "Option ID cannot be empty",
  }),
});
