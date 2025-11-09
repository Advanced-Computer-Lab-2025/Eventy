import Joi from 'joi';

export const applyLoyaltyProgramSchema = Joi.object({
  discountRate: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.base': 'Discount rate must be a number.',
      'number.min': 'Discount rate cannot be less than 0.',
      'number.max': 'Discount rate cannot exceed 100%.',
      'any.required': 'Discount rate is required.',
    }),

  promoCode: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Promo code can only contain letters and numbers.',
      'string.min': 'Promo code must be at least 3 characters.',
      'string.max': 'Promo code cannot exceed 20 characters.',
      'any.required': 'Promo code is required.',
    }),

  termsAndConditions: Joi.string()
    .max(500)
    .allow('')
    .required()
    .messages({
      'string.max': 'Terms and conditions cannot exceed 500 characters.',
    }),

  expiryDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Expiry date must be in the future.',
      'any.required': 'Expiry date is required.',
    }),
});
