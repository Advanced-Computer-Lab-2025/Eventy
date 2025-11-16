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
import roleMiddleware from "../middlewares/role.middleware.js";
import { Event } from "../features/events/event.model.js";

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

// Professor submissions: view status and requested edits of submitted workshops
// GET /api/workshops/:professorId
router.get(
  "/workshops/:professorId",
  verifyToken,
  roleMiddleware(["professor", "events_office", "admin"]),
  async (req, res, next) => {
    try {
      const { professorId } = req.params;

      // Security: professors can only view their own submissions
      if (
        req.user.role === "professor" &&
        String(req.user._id || req.user.id) !== String(professorId)
      ) {
        return res.status(403).json({
          message: "Forbidden: cannot view other professors' submissions",
        });
      }

      const filter = {
        eventType: "workshop",
        deletedAt: null,
        $or: [
          { createdBy: professorId },
          { professors: { $in: [professorId] } },
        ],
      };

      const workshops = await Event.find(filter)
        .select(
          "name status revisionComments createdAt _id professors createdBy"
        )
        .lean();

      // Normalize response for the frontend
      const submissions = (workshops || []).map((w) => ({
        _id: w._id,
        workshopId: w._id,
        name: w.name,
        status: w.status,
        requestedEdits: w.revisionComments || "",
        submissionDate: w.createdAt,
      }));

      return res.status(200).json(submissions);
    } catch (err) {
      next(err);
    }
  }
);

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
export default router;
