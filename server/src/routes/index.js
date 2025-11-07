import express from "express";
import authRoutes from "../features/auth/auth.route.js";
import verifyToken from "../middlewares/auth.middleware.js";
import userRoutes from "../features/users/user.route.js";
import eventRoutes from "../features/events/event.route.js";
import applicationRoutes from "../features/applications/application.route.js";
import facilityRoutes from "../features/facilities/facility.route.js";
import notificationRoutes from "../features/notifications/notification.route.js";
import uploadRoutes from "../features/upload/upload.route.js";
import transactionRoutes from "../features/transactions/transaction.route.js";

const PORT = process.env.PORT || 4000;
const router = express.Router();

// Placeholder route to confirm the API is working
router.get("/", (req, res) => {
  res.json({ message: "Welcome to the Eventy API!" });
});

// import authRoutes from '../features/auth/auth.route.js';
router.use("/auth", authRoutes);

// Example of protected routes
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.email}!`,
    user: req.user,
  });
});

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: `This is a protected dashboard for ${req.user.role}`,
  });
});

// Events routes
router.use("/events", eventRoutes);
router.use("/users", userRoutes);
// Applications routes
router.use("/applications", applicationRoutes);
//facilities routes
router.use("/facilities", facilityRoutes);
// notifications routes
router.use("/notifications", notificationRoutes);
// upload routes
router.use("/upload", uploadRoutes);
//transaction routes
router.use("/transactions",transactionRoutes);
export default router;
