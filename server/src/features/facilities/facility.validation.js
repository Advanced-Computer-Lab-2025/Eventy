import Joi from "joi";
import mongoose from "mongoose";

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
    .valid("yoga", "pilates", "aerobics", "zumba", "cross_circuit", "kick_boxing")
    .required()
    .messages({
      "any.only":
        "Invalid type. Must be one of yoga, pilates, aerobics, zumba, cross_circuit, or kick_boxing",
    }),

  instructorId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "any.required": "Instructor ID is required",
      "any.invalid": "Instructor ID must be a valid ObjectId",
    }),

  maxParticipants: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "number.base": "Max participants must be a number",
      "number.min": "There must be at least 1 participant allowed",
      "number.max": "Max participants cannot exceed 100",
    }),
});