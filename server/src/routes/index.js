import express from "express";
import authRoutes from "../features/auth/auth.route.js";
import verifyToken from "../middlewares/auth.middleware.js";
import userRoutes from "../features/users/user.route.js";
import eventRoutes from "../features/events/event.route.js";
import applicationRoutes from "../features/applications/application.route.js";
import facilityRoutes from "../features/facilities/facility.route.js";
import notificationRoutes from "../features/notifications/notification.route.js";
import uploadRoutes from "../features/upload/upload.route.js";
import loyaltyPartnerRoutes from "../features/loyaltyPartners/loyaltyPartner.route.js";
import feedbackRoutes from "../features/feedback/feedback.routes.js";
import transactionRoutes from "../features/transactions/transaction.route.js";
import pollRoutes from "../features/polls/poll.route.js";
import axios from "axios";

const PORT = process.env.PORT || 4000;
const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:8000";
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
// loyalty partner routes
router.use("/loyalty-partners", loyaltyPartnerRoutes);
// feedback routes
router.use("/feedback", feedbackRoutes);
//transaction routes
router.use("/transactions", transactionRoutes);
// poll routes
router.use("/polls", pollRoutes);

// ============================================
// AI RECOMMENDATION ROUTES (Proxy to Python Service)
// ============================================

// Get personalized recommendations for a user
router.get("/recommendations/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 8, exclude_registered = true } = req.query;

    const response = await axios.get(
      `${RECOMMENDATION_SERVICE_URL}/recommendations/user/${userId}`,
      {
        params: { limit, exclude_registered },
        timeout: 5000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Recommendation service error:", error.message);
    // Fallback to empty array if service is down
    res.json([]);
  }
});

// Get similar events
router.get("/recommendations/similar/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 6 } = req.query;

    const response = await axios.get(
      `${RECOMMENDATION_SERVICE_URL}/recommendations/similar/${eventId}`,
      {
        params: { limit },
        timeout: 5000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Recommendation service error:", error.message);
    res.json([]);
  }
});

// Get popular/trending events
router.get("/recommendations/popular", async (req, res) => {
  try {
    const { limit = 10, category, time_range = "week" } = req.query;

    const response = await axios.get(
      `${RECOMMENDATION_SERVICE_URL}/recommendations/popular`,
      {
        params: { limit, category, time_range },
        timeout: 5000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Recommendation service error:", error.message);
    res.json([]);
  }
});

// Refresh recommendation engine data
router.post("/recommendations/refresh", verifyToken, async (req, res) => {
  try {
    // Only allow admins/staff to refresh
    if (!["admin", "staff", "events_office"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/recommendations/refresh`,
      {},
      { timeout: 10000 }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Recommendation service error:", error.message);
    res.status(500).json({ message: "Failed to refresh recommendations" });
  }
});

// Track recommendation click (when user clicks a recommended event)
router.post("/recommendations/track-click", verifyToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    // Update user's clickedRecommendations array (add to set, limit to last 20)
    const { User } = await import("../features/users/user.model.js");
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { clickedRecommendations: eventId },
      },
      { new: true }
    );

    // Trim to last 20 clicks to avoid bloat
    const user = await User.findById(userId);
    if (
      user.clickedRecommendations &&
      user.clickedRecommendations.length > 20
    ) {
      user.clickedRecommendations = user.clickedRecommendations.slice(-20);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Track click error:", error.message);
    res.status(500).json({ message: "Failed to track click" });
  }
});

export default router;
