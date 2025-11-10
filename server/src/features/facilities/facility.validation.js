import Joi from "joi";
import mongoose from "mongoose";

export const gymSessionsQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base": "Month must be a number",
    "number.min": "Month must be between 1 and 12",
    "number.max": "Month must be between 1 and 12",
    "any.required": "Month is required",
  }),
  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Year must be a number",
    "number.min": "Year must be between 2000 and 2100",
    "number.max": "Year must be between 2000 and 2100",
  }),
});

export const createGymSessionSchema = Joi.object({
  date: Joi.date().required().messages({
    "any.required": "Date is required",
    "date.base": "Date must be a valid date",
  }),

  time: Joi.string()
    .pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .required()
    .messages({
      "any.required": "Time is required",
      "string.pattern.base": "Time must be in format hh:mm AM/PM",
    }),

  duration: Joi.number().integer().min(15).max(240).required().messages({
    "any.required": "Duration is required",
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 15 minutes",
    "number.max": "Duration cannot exceed 240 minutes",
  }),

  type: Joi.string()
    .valid(
      "yoga",
      "pilates",
      "aerobics",
      "zumba",
      "cross_circuit",
      "kick_boxing"
    )
    .required()
    .messages({
      "any.only":
        "Invalid type. Must be one of yoga, pilates, aerobics, zumba, cross_circuit, or kick_boxing",
    }),

  instructor: Joi.string().min(2).max(100).required().messages({
    "any.required": "Instructor name is required",
    "string.min": "Instructor name must be at least 2 characters",
    "string.max": "Instructor name cannot exceed 100 characters",
  }),

  maxParticipants: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Max participants must be a number",
    "number.min": "There must be at least 1 participant allowed",
    "number.max": "Max participants cannot exceed 100",
  }),
});

export const cancelGymSessionSchema = Joi.object({
  sessionId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Session ID is required",
      "string.pattern.base": "Session ID must be a valid MongoDB ObjectId",
    }),
});

export const editGymSessionSchema = Joi.object({
  date: Joi.date().optional().messages({
    "date.base": "Date must be a valid date",
  }),

  time: Joi.string()
    .pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .optional()
    .messages({
      "string.pattern.base":
        "Time must be in format hh:mm AM/PM (e.g., 02:00 PM)",
    }),

  duration: Joi.number().integer().min(15).max(240).optional().messages({
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 15 minutes",
    "number.max": "Duration cannot exceed 240 minutes",
  }),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field (date, time, or duration) must be provided",
  });

export const reserveCourtSchema = Joi.object({
  courtId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Court ID is required",
      "string.pattern.base": "Court ID must be a valid MongoDB ObjectId",
    }),
  date: Joi.date().required().messages({
    "any.required": "data is required",
    "date.base": "Date must be a valid date",
  }),
  courType: Joi.string()
    .valid("basketball", "tennis", "football")
    .required()
    .messages({
      "any.only": "Court type must be one of basketball, tennis, or football",
      "any.required": "Court type is required",
    }),
  startTime: Joi.date().required().messages({
    "any.required": "Start time is required",
    "date.base": "Start time must be a valid date",
  }),
  endTime: Joi.date().required().messages({
    "any.required": "End time is required",
    "date.base": "End time must be a valid date",
  }),
  bookedBy: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Booked By is required",
      "string.pattern.base": "Booked By must be a valid MongoDB ObjectId",
    }),
  bookedBy: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Booked By is required",
      "string.pattern.base": "Booked By must be a valid MongoDB ObjectId",
    }),
  status: Joi.string()
    .valid("confirmed", "cancelled", "completed")
    .required()
    .messages({
      "any.only": "Status must be one of confirmed, cancelled, or completed",
      "any.required": "Status is required",
    }),
});
