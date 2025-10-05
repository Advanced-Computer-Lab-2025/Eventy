import Joi from "joi";

// Schema for the "apply to bazaar" request body
export const applyToBazaarSchema = Joi.object({
  bazaarId: Joi.string().hex().length(24).required().messages({
    "string.base": "Bazaar ID must be a string",
    "string.hex": "Bazaar ID must be a valid MongoDB ObjectId",
    "any.required": "Bazaar ID is required",
  }),
  boothSize: Joi.string().valid("2x2", "4x4").required(),
  staff: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      })
    )
    .max(5)
    .required()
    .messages({
      "array.max": "You can add a maximum of 5 staff members.",
      "any.required": "Staff details are required.",
    }),
  // Add other required fields from your form here
  durationWeeks: Joi.number().integer().min(1).required(),
  locationPreference: Joi.string().optional().allow(""), // .allow('') makes it optional but not null
});
