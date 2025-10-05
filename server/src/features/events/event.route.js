import express from 'express';
import {EventsController} from './event.controller.js';
import auth from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

const router = express.Router();
const eventsController = new EventsController();

//create bazaar
router.post(
  '/bazaars',
  authMiddleware,                 // verifies JWT (mock for now)
  roleMiddleware('EventsOffice'), // only EventsOffice can access
  eventController.createBazaar    // controller we created
);

// Accept workshop
router.patch('/:id/accept', auth, role(['admin']), eventsController.acceptWorkshop);

// Reject workshop
router.patch('/:id/reject', auth, role(['admin']), eventsController.rejectWorkshop);

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
  eventsController.createConferenceController
);

export default router;
