import Joi from "joi";

export const gymSessionsQuerySchema = Joi.object({
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      "number.base": "Month must be a number",
      "number.min": "Month must be between 1 and 12",
      "number.max": "Month must be between 1 and 12",
      "any.required": "Month is required",
    }),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .required()
    .messages({
      "number.base": "Year must be a number",
      "number.min": "Year must be between 2000 and 2100",
      "number.max": "Year must be between 2000 and 2100",
      "any.required": "Year is required",
    }),
});