import Joi from 'joi';

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
