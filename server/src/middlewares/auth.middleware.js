// Temporary mock authentication middleware for development/testing
// Replace this later with real JWT-based authentication.

export default (req, res, next) => {
  // Simulate a logged-in user (you can change role depending on who's testing)
  req.user = {
    _id: "66f123abc987de0012f9f999",
    name: "Test Events Office User",
    role: "user",
  };

  next();
};

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized user",
      });
    }
    next();
  };
}

/*
Once real authentication is implemented, replace this middleware with one that:
- Verifies the JWT token
- Decodes it
- Loads the real user from the database

Example for later use:
---------------------------------
import jwt from 'jsonwebtoken';
import User from '../features/users/user.model.js';

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
---------------------------------
*/
