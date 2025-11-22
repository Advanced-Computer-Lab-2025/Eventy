import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";
import { PollController } from "./poll.controller.js";

const router = express.Router();
const pollController = new PollController();

router.get(
  "/booth-conflict",
  authMiddleware,
  role(["events_office", "admin"]),
  pollController.listBoothConflictPolls.bind(pollController)
);

router.post(
  "/booth-conflict",
  authMiddleware,
  role(["events_office", "admin"]),
  pollController.createBoothConflictPoll.bind(pollController)
);

router.patch(
  "/:pollId/end",
  authMiddleware,
  role(["events_office", "admin"]),
  pollController.endPoll.bind(pollController)
);

export default router;
