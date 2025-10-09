import express from "express";
import { ApplicationController } from "./application.controller.js";
import { applyToBazaarSchema , getMyApplicationsSchema} from "./application.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import role from "../../middlewares/role.middleware.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";

const router = express.Router();
const applicationController = new ApplicationController();

// POST /api/applications
router.post(
  "/",
  authMiddleware,
  role(["vendor"]),
  validate(applyToBazaarSchema),
  applicationController.applyToBazaar.bind(applicationController)
);

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

export default router;
