import Joi from 'joi';

// Validation schema for adding to favorites
export const addToFavoritesSchema = Joi.object({
  eventId: Joi.string().required().messages({
    'string.empty': 'Event ID is required',
    'any.required': 'Event ID is required'
  })
});

// Validation schema for user ID parameter
export const userIdParamSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
    'any.required': 'User ID is required'
  })
});

// Validation schema for event ID parameter
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().required().messages({
    'string.empty': 'Event ID is required',
    'any.required': 'Event ID is required'
  })
});
