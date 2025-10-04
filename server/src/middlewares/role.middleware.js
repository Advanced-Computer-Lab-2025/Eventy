// Role-based access control middleware

module.exports = (requiredRole) => {
    return (req, res, next) => {
      // If there’s no authenticated user, block access
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
  
      // If the user’s role doesn’t match, block access
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }
  
      // Otherwise, allow the request
      next();
    };
  };
  