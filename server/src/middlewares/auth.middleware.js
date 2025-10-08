import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token for protected routes
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from the "Authorization" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");

    // Attach user data to request for later use
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};
