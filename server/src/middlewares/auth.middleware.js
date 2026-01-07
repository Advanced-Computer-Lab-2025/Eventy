import jwt from "jsonwebtoken";
import { User } from "../features/users/user.model.js";

const getCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValParts] = part.trim().split("=");
    if (!rawKey) continue;
    if (rawKey === name) {
      const rawVal = rawValParts.join("=");
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }
  return null;
};
export const validateToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const bearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
  const cookieToken = getCookieValue(req.headers?.cookie, cookieName);

  const token = bearerToken || cookieToken;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Missing authentication (Bearer token or cookie)" });
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

    // Add unified status check
    if (user.status === "blocked") {
      return res.status(403).json({
        message:
          "You are currently a blocked user. Please contact the administrator.",
      });
    }

    req.user = user; // Now req.user has _id, role, etc.
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
const _verifyToken = async (req, res, next, decoded) => {
  try {
    // ...existing token verification...

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add unified status check
    if (user.status === "blocked") {
      return res.status(403).json({
        message:
          "You are currently a blocked user. Please contact the administrator.",
      });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
