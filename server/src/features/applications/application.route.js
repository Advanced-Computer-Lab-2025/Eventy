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
  role(["admin", "eventsOffice"]),
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

router.post(
  "/bazaars/:eventId/apply",
  authMiddleware,
  validate(validateBazaarApplication),
  applicationController.applyToBazaar.bind(applicationController)
);

router.post(
  "/booths/apply",
  authMiddleware,
  validate(validateBoothApplication),
  applicationController.applyToBooth.bind(applicationController)
);

export default router;
