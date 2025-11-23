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

router.get(
  "/gym/sessions",
  authMiddleware,
  facilitiesController.getGymSessions.bind(facilitiesController)
);

/**
 * @route   POST /api/facilities/courts/reserve
 * @desc    Reserve a court for a specific time slot
 * @access  Private (Students only)
 */
router.post(
  "/courts/reserve",
  authMiddleware,
  facilitiesController.reserveCourt.bind(facilitiesController)
);

/**
 * @route   POST /api/facilities/admin/gym/sessions
 * @desc    Create a new gym session (Admin or Events Office only)
 * @access  Private
 */
router.post(
  "/admin/gym/sessions",
  authMiddleware,
  facilitiesController.createGymSession.bind(facilitiesController)
);

/**
 *
 */
router.post(
  "/gym/sessions/:sessionId/register",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  facilitiesController.registerForGymSession.bind(facilitiesController)
);

/**
 * @route   PATCH /api/facilities/gym/sessions/:sessionId/cancel
 * @desc    Cancel a gym session by ID (Events Office only)
 * @access  Private
 */
router.patch(
  "/gym/sessions/:sessionId/cancel",
  authMiddleware,
  facilitiesController.cancelGymSession.bind(facilitiesController)
);

/**
 * @route   PATCH /api/facilities/gym/sessions/:sessionId
 * @desc    Edit a gym session (date, time, duration only) (Events Office only)
 * @access  Private
 */
router.patch(
  "/gym/sessions/:sessionId",
  authMiddleware,
  facilitiesController.editGymSession.bind(facilitiesController)
);

export default router;
