import express from "express";
import { FacilitiesController } from "./facility.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();
const facilitiesController = new FacilitiesController();

/**
 * @route   GET /api/facilities/courts
 * @desc    Get schedules for all court facilities
 * @access  Private (All authenticated users)
 */
router.get(
  "/courts",
  authMiddleware, // Ensures the user is logged in
  facilitiesController.getCourtSchedules.bind(
    facilitiesController.getCourtSchedules
  )
);

export default router;
