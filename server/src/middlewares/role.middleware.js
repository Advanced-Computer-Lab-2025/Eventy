// src/middlewares/role.middleware.js
import ApiError from '../utils/ApiError.js';

const role = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role)
      return next(new ApiError(401, 'Unauthorized: no user information found'));

    if (!allowedRoles.includes(req.user.role))
      return next(new ApiError(403, 'Forbidden: insufficient permissions'));

    next();
  };
};

export default role;
