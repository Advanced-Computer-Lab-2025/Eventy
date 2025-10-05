import express from "express";
import { EventsController } from "./event.controller.js";
import auth from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";

const router = express.Router();
const eventsController = new EventsController();

// POST /api/admin/trips
router.post(
  "/admin/trips",
  auth,
  role(["admin", "events_office"]),
  eventsController.createTrip.bind(eventsController)
);
// GET /api/events?type=bazaar
router.get(
  "/",
  auth,
  role(["vendor"]),
  eventsController.getEvents.bind(eventsController)
);
export default router;
