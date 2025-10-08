import express from "express";
import { getUpcomingEventsController } from "./event.controller.js";
import { EventsController } from "./event.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import * as eventController from "./event.controller.js";

const router = express.Router();
const eventsController = new EventsController();

// Create bazaar /events/bazaars
router.post(
  "/bazaars",
  authMiddleware, // verifies JWT (mock for now)
  roleMiddleware("events_office"),
  eventsController.createBazaar
);

// PATCH /api/bazaars/:id - Edit bazaar details
router.patch(
  "/bazaars/:id",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.editBazaar.bind(eventsController)
);
// DELETE /api/admin/events/:eventId - Delete an event
router.delete(
  "/admin/events/:eventId",
  authMiddleware,
  roleMiddleware(["events_office", "admin"]),
  eventsController.deleteEvent.bind(eventsController)
);

// PATCH /api/admin/trips/:tripId
router.patch(
  "/admin/trips/:tripId",
  authMiddleware,
  roleMiddleware("admin", "events_office"),
  eventsController.updateTripController
);

// Create workshop
router.post(
  "/workshops",
  authMiddleware,
  roleMiddleware(["professor"]),
  eventsController.createWorkshop.bind(eventsController)
);

//  Get my workshops
router.get(
  "/me/workshops",
  authMiddleware,
  roleMiddleware(["professor"]),
  eventsController.getMyWorkshops.bind(eventsController)
);

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

// Edit a workshop that needs revision
router.patch(
  "/workshops/:workshopId",
  authMiddleware,
  roleMiddleware(["professor"]),
  eventsController.editWorkshop.bind(eventsController)
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

router.patch(
  "/admin/conferences/:conferenceId",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  eventsController.updateConferenceController.bind(eventsController)
);


router.get(
  "/upcoming",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getUpcomingEventsController
);

export default router;
