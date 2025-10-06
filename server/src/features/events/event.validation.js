import Joi from "joi";
import mongoose from "mongoose";

// Custom ObjectId validator
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

export const createTripSchema = Joi.object({
  name: Joi.string().trim().required(),
  location: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  registrationDeadline: Joi.date().required(),
  price: Joi.number().positive().required(),
  capacity: Joi.number().integer().min(1).optional(),
});

export const createConferenceSchema = Joi.object({
  name: Joi.string().trim().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  description: Joi.string().trim().required(),
  websiteUrl: Joi.string()
    .uri()
    .message("Invalid website URL format")
    .optional(),
  requiredBudget: Joi.number().positive().required(),
  fundingSource: Joi.string().valid("external", "guc").required(),
  extraResources: Joi.string().optional(),
  agenda: Joi.string().optional(),
});

// Validation schema for workshop status update
export const workshopStatusSchema = Joi.object({
  id: Joi.string().custom(objectId).required(),
  status: Joi.string().valid("approved", "rejected").required(),
});

export const createWorkshopSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Workshop name is required",
    "string.base": "Workshop name must be text",
  }),

  eventType: Joi.string().valid("workshop").default("workshop").messages({
    "any.only": "Event type must be 'workshop'",
  }),

  description: Joi.string().required().messages({
    "any.required": "Workshop description is required",
    "string.base": "Description must be text",
  }),

  location: Joi.string().valid("GUC Cairo", "GUC Berlin").required().messages({
    "any.required": "Workshop location is required",
    "any.only": "Location must be either 'GUC Cairo' or 'GUC Berlin'",
  }),

  startDate: Joi.date().required().messages({
    "any.required": "Workshop start date is required",
    "date.base": "Invalid start date format",
  }),

  endDate: Joi.date().greater(Joi.ref("startDate")).required().messages({
    "any.required": "Workshop end date is required",
    "date.base": "Invalid end date format",
    "date.greater": "End date must be after start date",
  }),

  registrationDeadline: Joi.date()
    .less(Joi.ref("startDate"))
    .required()
    .messages({
      "any.required": "Registration deadline is required",
      "date.base": "Invalid registration deadline format",
      "date.less": "Registration deadline must be before start date",
    }),

  status: Joi.string().valid("pending").default("pending").messages({
    "any.only": "Status must be: pending",
  }),

  capacity: Joi.number().integer().min(1).optional().messages({
    "number.base": "Capacity must be a number",
    "number.min": "Capacity must be at least 1",
  }),

  agenda: Joi.string().required().messages({
    "any.required": "Workshop agenda is required",
    "string.base": "Agenda must be text",
  }),

  requiredBudget: Joi.number().required().messages({
    "any.required": "Required budget is required",
    "number.base": "Required budget must be a number",
  }),

  fundingSource: Joi.string().valid("external", "guc").required().messages({
    "any.required": "Funding source is required",
    "any.only": "Funding source must be either 'external' or 'guc'",
  }),

  extraResources: Joi.string().optional().messages({
    "string.base": "Extra resources must be text",
  }),

  faculty: Joi.string().required().messages({
    "any.required": "Faculty is required (e.g., MET, IET, etc.)",
    "string.base": "Faculty must be text",
  }),

  professors: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required()
    .messages({
      "any.required": "At least one professor is required",
      "array.min": "Professors list must contain at least one ID",
      "string.hex": "Professor IDs must be valid ObjectIds",
    }),
});

export const updateBazaarSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.base": "Bazaar name must be text",
  }),

  description: Joi.string().trim().optional().messages({
    "string.base": "Bazaar description must be text",
  }),

  location: Joi.string().trim().optional().messages({
    "string.base": "Bazaar location must be text",
  }),

  startDate: Joi.date().optional().messages({
    "date.base": "Invalid start date format",
  }),

  endDate: Joi.date().optional().messages({
    "date.base": "Invalid end date format",
  }),

  registrationDeadline: Joi.date().optional().messages({
    "date.base": "Invalid registration deadline format",
  }),

  status: Joi.string()
    .valid("pending", "approved", "rejected", "needs_revision")
    .optional()
    .messages({
      "any.only":
        "Status must be one of: pending, approved, rejected, or needs_revision",
    }),

  capacity: Joi.number().integer().min(1).optional().messages({
    "number.base": "Capacity must be a number",
    "number.min": "Capacity must be at least 1",
  }),

  bannerImage: Joi.string().uri().optional().messages({
    "string.uri": "Banner image must be a valid URL",
  }),

  extraResources: Joi.string().optional().messages({
    "string.base": "Extra resources must be text",
  }),

  // Prevent fields that belong to other event types
  price: Joi.forbidden(),
  agenda: Joi.forbidden(),
  requiredBudget: Joi.forbidden(),
  fundingSource: Joi.forbidden(),
  faculty: Joi.forbidden(),
  professors: Joi.forbidden(),
  websiteUrl: Joi.forbidden(),
});
