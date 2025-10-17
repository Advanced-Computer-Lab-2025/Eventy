// src/middlewares/role.middleware.js
import ApiError from "../utils/ApiError.js";
console.log("🧩 role.middleware.js successfully loaded!");

const role = (allowedRoles = []) => {
  console.log("🧠 ROLE MIDDLEWARE CALLED with allowedRoles:", allowedRoles);
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized: no user information found"));
    }

    const userRole = req.user.role;
    console.log("👤 User Role:", userRole);
    console.log("✅ Allowed Roles:", allowedRoles);

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(403, "Forbidden: insufficient permissions"));
    }

    next();
  };
};

export default role;
