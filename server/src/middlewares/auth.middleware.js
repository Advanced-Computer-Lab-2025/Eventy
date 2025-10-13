import jwt from "jsonwebtoken";

export const validateToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

// ✅ TEMPORARY DEV BYPASS — gives full access
if (process.env.NODE_ENV !== "production" && token === "dev-token") {
  req.user = {
    id: "dev-user",
    email: "dev@example.com",
    role: "vendor", // 🔥 set as vendor to access /upcoming endpoint
    _id: "dev-user-id", // Add _id for compatibility
  };
  return next();
}


  // Normal production verification
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
