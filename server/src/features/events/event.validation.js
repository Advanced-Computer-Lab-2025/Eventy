import Joi from 'joi';
import mongoose from 'mongoose';

// Custom ObjectId validator
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
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
  capacity: Joi.number().integer().min(1).optional()
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
  agenda: Joi.string().optional()
});


// Validation schema for workshop status update
export const workshopStatusSchema = Joi.object({
  id: Joi.string().custom(objectId).required(),
  status: Joi.string().valid('approved', 'rejected').required()
});
