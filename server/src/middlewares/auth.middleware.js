import jwt from "jsonwebtoken";
import { User } from "../features/users/user.model.js";
export const validateToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full user object from database
    const user = await User.findById(
      decoded.id || decoded.userId || decoded._id
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // Now req.user has _id, role, etc.
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
