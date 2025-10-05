import express from 'express';
import { EventsController, acceptWorkshop, rejectWorkshop, createConferenceController } from './event.controller.js';
import auth from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";

const router = express.Router();
const eventsController = new EventsController();

// Accept workshop
router.patch('/:id/accept', auth, role(['admin']), acceptWorkshop);

// Reject workshop
router.patch('/:id/reject', auth, role(['admin']), rejectWorkshop);

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

router.post(
  "/admin/conferences",
  auth,
  role(["admin", "events_office"]),
  createConferenceController
);

export default router;