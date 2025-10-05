// src/middlewares/auth.middleware.js

// Temporary middleware for development (no token required)
const auth = (req, res, next) => {
  // Pretend this user is logged in
  req.user = {
    id: '6700aa92fe2d3a8712f97b21',     // fake user ID
    role: 'admin'            // or 'events_office'
  };
  next();
};

export default auth;
