import express from "express";
import { ApplicationController } from "./application.controller.js";
import { applyToBazaarSchema } from "./application.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import role from "../../middlewares/role.middleware.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

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

export default router;
