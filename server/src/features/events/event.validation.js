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
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
});

export const updateConferenceSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  websiteUrl: Joi.string().uri().optional(),
  requiredBudget: Joi.number().positive().optional(),
  fundingSource: Joi.string().valid("external", "guc").optional(),
  extraResources: Joi.string().optional(),
  agenda: Joi.string().optional(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
}).min(1);

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
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "any.required": "Start time is required",
      "string.pattern.base": "Start time must be in HH:mm format",
    }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "any.required": "End time is required",
      "string.pattern.base": "End time must be in HH:mm format",
    }),

  startDate: Joi.date().greater("now").required().messages({
    "any.required": "Workshop start date is required",
    "date.base": "Invalid start date format",
    "date.greater": "Start date must be in the future",
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

  price: Joi.number().positive().required().messages({
    "any.required": "Workshop price is required",
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
  }),
});

export const updateWorkshopSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().optional(),
  location: Joi.string().valid("GUC Cairo", "GUC Berlin").optional(),
  startDate: Joi.date().greater("now").optional().messages({
    "date.greater": "Start date must be in the future",
  }),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  endDate: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref("startDate")),
    otherwise: Joi.date().optional(),
  }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  registrationDeadline: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().less(Joi.ref("startDate")),
    otherwise: Joi.date().optional(),
  }),
  capacity: Joi.number().integer().min(1).optional(),
  agenda: Joi.string().optional(),
  requiredBudget: Joi.number().positive().optional(),
  fundingSource: Joi.string().valid("external", "guc").optional(),
  extraResources: Joi.string().optional(),
  faculty: Joi.string().optional(),
  professors: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .optional(),

  price: Joi.forbidden(),
  websiteUrl: Joi.forbidden(),
}).min(1);

export const updateTripSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  location: Joi.string(),
  startDate: Joi.date().greater("now"),
  endDate: Joi.date(),
  registrationDeadline: Joi.date(),
  capacity: Joi.number(),
  price: Joi.number().positive(),
}).min(1);

export const createBazaarSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Bazaar name is required",
    "string.base": "Bazaar name must be text",
  }),
  eventType: Joi.string().valid("bazaar").default("bazaar"),
  description: Joi.string().trim().required().messages({
    "any.required": "Bazaar description is required",
  }),
  location: Joi.string().trim().required().messages({
    "any.required": "Bazaar location is required",
  }),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "any.required": "Bazaar start time is required",
      "string.pattern.base": "Start time must be in HH:mm format",
    }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "any.required": "Bazaar end time is required",
      "string.pattern.base": "End time must be in HH:mm format",
    }),
  registrationDeadline: Joi.date().less(Joi.ref("startDate")).required(),
  capacity: Joi.number().integer().min(1).optional(),
  bannerImage: Joi.string().uri().optional(),
  extraResources: Joi.string().optional(),
}).unknown(false);

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

  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .messages({
      "string.pattern.base": "Start time must be in HH:mm format",
    }),

  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .messages({
      "string.pattern.base": "End time must be in HH:mm format",
    }),

  // Prevent fields that belong to other event types
  price: Joi.forbidden(),
  agenda: Joi.forbidden(),
  requiredBudget: Joi.forbidden(),
  fundingSource: Joi.forbidden(),
  faculty: Joi.forbidden(),
  professors: Joi.forbidden(),
  websiteUrl: Joi.forbidden(),
}).min(1);

export const getAttendeesReportSchema = Joi.object({
  eventType: Joi.string()
    .valid("conference", "workshop", "bazaar", "trip", "platform_booth")
    .optional()
    .messages({
      "any.only":
        "Event type must be one of: conference, workshop, bazaar, trip, or platform_booth",
    }),

  startDate: Joi.date().iso().optional().messages({
    "date.base": "startDate must be a valid ISO date",
  }),

  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.base": "endDate must be a valid ISO date",
    "date.min": "endDate cannot be before startDate",
  }),

  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).options({ stripUnknown: true });
