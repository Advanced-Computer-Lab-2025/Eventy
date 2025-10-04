import Joi from 'joi';
import mongoose from 'mongoose';

// Custom ObjectId validator
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Validation schema for workshop status update
export const workshopStatusSchema = Joi.object({
  id: Joi.string().custom(objectId).required(),
  status: Joi.string().valid('approved', 'rejected').required()
});
