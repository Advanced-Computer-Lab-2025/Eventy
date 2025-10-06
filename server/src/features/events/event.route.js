import express from "express";
import { EventsController } from "./event.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();
const eventsController = new EventsController();

// Create bazaar /events/bazaars
router.post(
  "/bazaars",
  authMiddleware, // verifies JWT (mock for now)
  roleMiddleware("EventsOffice"), // only EventsOffice can access
  eventsController.createBazaar // controller we created
);

// PATCH /api/bazaars/:id - Edit bazaar details
router.patch(
  "/bazaars/:id",
  authMiddleware,
  roleMiddleware(["EventsOffice"]),
  eventsController.editBazaar.bind(eventsController)
);

// Create workshop
router.post(
  "/workshops",
  authMiddleware,
  roleMiddleware(["professor"]),
  eventsController.createWorkshop.bind(eventsController)
);

//  Get my workshops
router.get('/me/workshops', authMiddleware, roleMiddleware(['professor']), eventsController.getMyWorkshops.bind(eventsController));

// Accept workshop
router.patch(
  "/:id/accept",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.acceptWorkshop.bind(eventsController)
);

// Reject workshop
router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.rejectWorkshop.bind(eventsController)
);

// POST /api/admin/trips
router.post(
  "/admin/trips",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  eventsController.createTrip.bind(eventsController)
);

// GET /api/events?type=bazaar
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["vendor"]),
  eventsController.getEvents.bind(eventsController)
);

router.post(
  "/admin/conferences",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  eventsController.createConferenceController
);
//Rana (to be deleted later)
//register for workshop/trip
router.post('/:id/register', authMiddleware, roleMiddleware(['student', 'staff','ta','professor']), eventsController.registerForEvent.bind(eventsController));

router.get(
  "/me/events",
  authMiddleware, // user must be logged in
  eventsController.getMyEvents.bind(eventsController)
);

export default router;
