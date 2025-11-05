import express from "express";
import { ApplicationController } from "./application.controller.js";
import {
  validateBazaarApplication,
  validateBoothApplication,
  getMyApplicationsSchema
} from "./application.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import role from "../../middlewares/role.middleware.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";

const router = express.Router();
const applicationController = new ApplicationController();

router.get(
  "/me",
  authMiddleware,
  role(["vendor"]),
  validateQuery(getMyApplicationsSchema), // Use the new middleware here
  applicationController.getMyApplications.bind(applicationController)
);
// PATCH /api/admin/applications/:applicationId/status
router.patch(
  "/:applicationId/status",
  authMiddleware,
  role(["admin", "events_office"]),
  applicationController.updateApplicationStatus.bind(applicationController)
);

/**
 * @route   GET /api/admin/bazaars/:bazaarId/applications
 * @desc    Get all vendor applications for a specific bazaar
 * @access  Admin / Events Office
 */
router.get(
  "/",
  authMiddleware,
  role(["events_office", "admin"]),
  ApplicationController.getAllApplications
);

/**
 * @route   POST /api/applications/bazaars/:eventId/apply
 * @desc    Apply to a bazaar event as a vendor
 * @access  Vendor
 * @body    { attendees: [{ name, email, individualID (URL from /api/upload endpoint) }], boothSize }
 * @note    Upload ID images first using POST /api/upload to get the individualID URL
 */
router.post(
  "/bazaars/:eventId/apply",
  authMiddleware,
  validate(validateBazaarApplication),
  applicationController.applyToBazaar.bind(applicationController)
);

/**
 * @route   POST /api/applications/booths/apply
 * @desc    Apply for a platform booth as a vendor
 * @access  Vendor
 * @body    { attendees: [{ name, email, individualID (URL from /api/upload endpoint) }], boothSize, durationWeeks, locationPreference }
 * @note    Upload ID images first using POST /api/upload to get the individualID URL
 */
router.post(
  "/booths/apply",
  authMiddleware,
  validate(validateBoothApplication),
  applicationController.applyToBooth.bind(applicationController)
);

/**
 * @route   DELETE /api/applications/:applicationId/cancel
 * @desc    Cancel a vendor's participation request
 * @access  Vendor (only their own applications)
 */
router.delete(
  "/:applicationId/cancel",
  authMiddleware,
  role(["vendor"]),
  applicationController.cancelApplication.bind(applicationController)
);

/**
 * @route   GET /api/applications/attendee/verify/:token
 * @desc    Display attendee details as HTML page (for QR code scanning)
 * @access  Public (via token)
 * @note    This route must come BEFORE /attendee/:token to avoid route conflicts
 */
router.get(
  "/attendee/verify/:token",
  applicationController.getAttendeeByTokenHTML.bind(applicationController)
);

/**
 * @route   GET /api/applications/attendee/:token
 * @desc    Get attendee details via QR code token (public endpoint - JSON)
 * @access  Public (via token)
 */
router.get(
  "/attendee/:token",
  applicationController.getAttendeeByToken.bind(applicationController)
);

export default router;
