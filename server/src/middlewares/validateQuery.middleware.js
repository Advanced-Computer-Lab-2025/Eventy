import ApiError from '../utils/ApiError.js';

const validateQuery = (schema) => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error } = schema.validate(req.query, { abortEarly: true });
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }
    next();
  };
};

export default validateQuery;