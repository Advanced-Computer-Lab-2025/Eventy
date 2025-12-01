// server/src/features/users/user.validation.js
import Joi from "joi";
import mongoose from "mongoose";

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value))
    return helpers.error("any.invalid");
  return value;
};

export const UserValidation = {
  assignRole: Joi.object({
    // role passed in body
    role: Joi.string().valid("staff", "ta", "professor").required(),
    // we will validate params.id by adding it here when validating
    userId: Joi.string().custom(objectId).required(),
  }),
};

// server/src/features/users/user.validation.js (MODIFIED)

// Schema for creating Admin/Events Office accounts
export const createManagementAccountSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  email: Joi.string()
    .pattern(/^[A-Za-z0-9._%+-]+@guc\.edu\.eg$/)
    .message("Email must be in the format username@guc.edu.eg")
    .required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "events_office").required(),
  studentStaffId: Joi.string().required(),
});

export const deleteUserSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "User ID must be a valid MongoDB ID.",
    "string.length": "User ID must be 24 characters long.",
    "any.required": "User ID is required.",
  }),
});

// Schema for blocking/unblocking users
export const toggleBlockUserSchema = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    "string.hex": "User ID must be a valid MongoDB ID.",
    "string.length": "User ID must be 24 characters long.",
    "any.required": "User ID is required.",
  }),
  action: Joi.string().valid("block", "unblock").required().messages({
    "any.required": "Action is required (block/unblock)",
    "any.only": 'Action must be either "block" or "unblock"',
  }),
});

// Schema for favorite events
export const favoriteEventSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid MongoDB ID.",
    "string.length": "Event ID must be 24 characters long.",
    "any.required": "Event ID is required.",
  }),
});
