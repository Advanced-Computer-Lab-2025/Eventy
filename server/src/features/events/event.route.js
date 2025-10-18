import express from "express";
import { EventsController } from "./event.controller.js";
import authMiddleware from ".././../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();
const eventsController = new EventsController();

router.get(
  "/gettrips",
  authMiddleware,
  roleMiddleware("events_office"),
  eventsController.getAllTrips.bind(eventsController)
);
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
  "/edit/trips/:tripId",
  authMiddleware,
  roleMiddleware("events_office"),
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

// Request edits for workshop
router.patch(
  "/:id/request-edits",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.requestEdits.bind(eventsController)
);

// POST /api/admin/trips
router.post(
  "/createtrips",
  authMiddleware,
  roleMiddleware(["events_office"]),
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
  roleMiddleware(["events_office"]),
  eventsController.createConferenceController
);

router.get(
  "/admin/conferences",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.getConferencesController.bind(eventsController)
);

router.get(
  "/admin/conferences/:conferenceId",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.getConferenceByIdController.bind(eventsController)
);

router.patch(
  "/admin/conferences/:conferenceId",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.updateConferenceController.bind(eventsController)
);
//get all upcoming events (approved events)
router.get(
  "/upcoming",
  authMiddleware,
  roleMiddleware([
    "student",
    "staff",
    "events_office",
    "ta",
    "professor",
    "admin",
  ]),
  eventsController.getUpcomingEvents.bind(eventsController)
);

// Search events ( new feature)
router.get(
  "/search",
  authMiddleware,
  roleMiddleware([
    "student",
    "staff",
    "events_office",
    "ta",
    "professor",
    "admin",
  ]),
  eventsController.searchEvents.bind(eventsController)
);

router.get(
  "/allworkshops",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  eventsController.viewAllWorkshops.bind(eventsController)
);

// Get all events the logged-in user registered for
router.get(
  "/me/events",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.getMyEvents.bind(eventsController)
);

// Get event by ID (vendor only)
router.get(
  "/:eventId",
  authMiddleware,
  roleMiddleware(["vendor", "student", "staff", "ta", "professor", "admin", "events_office"]),
  eventsController.getEventById.bind(eventsController)
);

router.post(
  "/:id/register",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.registerForEvent.bind(eventsController)
);

export default router;
