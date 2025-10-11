// src/middlewares/validate.middleware.js
import ApiError from '../utils/ApiError.js';



const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error } = schema.validate(req[property], { abortEarly: true });
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    next();
  };
};

export default validate;
