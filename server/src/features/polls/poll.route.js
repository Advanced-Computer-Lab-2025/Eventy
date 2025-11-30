import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";
import { PollController } from "./poll.controller.js";

const router = express.Router();
const pollController = new PollController();

const voterRoles = ["student", "staff", "ta", "professor"];

router.get(
  "/active",
  authMiddleware,
  role(voterRoles),
  pollController.listActivePolls.bind(pollController)
);

router.post(
  "/:pollId/vote",
  authMiddleware,
  role(voterRoles),
  pollController.vote.bind(pollController)
);

router.get(
  "/booth-conflict",
  authMiddleware,
  role(["events_office"]),
  pollController.listBoothConflictPolls.bind(pollController)
);

router.post(
  "/booth-conflict",
  authMiddleware,
  role(["events_office"]),
  pollController.createBoothConflictPoll.bind(pollController)
);

router.patch(
  "/:pollId/end",
  authMiddleware,
  role(["events_office"]),
  pollController.endPoll.bind(pollController)
);

export default router;
