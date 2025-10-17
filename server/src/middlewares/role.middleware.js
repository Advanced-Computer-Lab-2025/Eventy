// src/middlewares/role.middleware.js
import ApiError from '../utils/ApiError.js';

const role = (allowedRoles = []) => {
  return (req, res, next) => {
    
    const userId = req.user._id || req.user.id;
    if (!req.user || !req.user.role)
      return next(new ApiError(401, 'Unauthorized: no user information found'));

    if (!allowedRoles.includes(req.user.role))
      return next(new ApiError(403, 'Forbidden: insufficient permissions'));
    
    next();
  };
};


export default role;
