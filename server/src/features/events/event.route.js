import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { EventsController } from "./event.controller.js";
import authMiddleware from ".././../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();
const eventsController = new EventsController();

// Record view
router.post(
  "/:eventId/view",
  authMiddleware,
  eventsController.recordView.bind(eventsController)
);
// Configure multer for event images
const blobToken =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.CUSTOMCONNSTR_BLOB_READ_WRITE_TOKEN;
const isVercel = !!blobToken;
const eventImagesDir = isVercel
  ? os.tmpdir()
  : path.join(process.cwd(), "uploads", "event-images");

if (!isVercel && !fs.existsSync(eventImagesDir)) {
  fs.mkdirSync(eventImagesDir, { recursive: true });
}

const eventImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, eventImagesDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomSuffix}${fileExtension}`;
    cb(null, filename);
  },
});

const uploadEventImage = multer({
  storage: eventImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif)"));
    }
  },
});

router.get(
  "/marketplace",
  authMiddleware,
  eventsController.getMarketplace.bind(eventsController)
);

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
// DELETE /api/events/:eventId - Delete an event (for admin/events_office)
router.delete(
  "/:eventId",
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

// Get participants and remaining spots for a workshop (professor only)
router.get(
  "/workshops/:workshopId/participants",
  authMiddleware,
  roleMiddleware(["professor"]),
  eventsController.getWorkshopParticipants.bind(eventsController)
);

// Accept workshop
router.patch(
  "/:id/accept",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.acceptWorkshop.bind(eventsController)
);

// Approve bazaar
router.patch(
  "/bazaars/:id/approve",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.approveBazaar.bind(eventsController)
);

// Reject workshop
router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.rejectWorkshop.bind(eventsController)
);

// Archive event (only Events Office, and only after endDate has passed)
router.patch(
  "/:id/archive",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.archiveEvent.bind(eventsController)
);

// Unarchive event (only Events Office)
router.patch(
  "/:id/unarchive",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.unarchiveEvent.bind(eventsController)
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

// Get ongoing events (events that have started but not ended yet)
router.get(
  "/ongoing",
  authMiddleware,
  roleMiddleware([
    "student",
    "staff",
    "events_office",
    "ta",
    "professor",
    "admin",
  ]),
  eventsController.getOngoingEvents.bind(eventsController)
);

// Upload image to ongoing event (registered attendees only)
router.post(
  "/:eventId/upload-image",
  authMiddleware,
  (req, res, next) => {
    uploadEventImage.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  eventsController.uploadImageToEvent.bind(eventsController)
);

// Get all uploaded images for an event
router.get(
  "/:eventId/images",
  authMiddleware,
  roleMiddleware([
    "student",
    "staff",
    "events_office",
    "ta",
    "professor",
    "admin",
  ]),
  eventsController.getEventImages.bind(eventsController)
);

// Get past events (events whose endDate has passed) - Events Office / Admin
router.get(
  "/past",
  authMiddleware,
  roleMiddleware([
    "student",
    "staff",
    "events_office",
    "ta",
    "professor",
    "admin",
  ]),
  eventsController.getPastEvents.bind(eventsController)
);

// Get archived events - Events Office only
router.get(
  "/archived",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.getArchivedEvents.bind(eventsController)
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
// Get attendees count for an event
router.get(
  "/reports/attendees",
  authMiddleware,
  roleMiddleware(["events_office", "admin"]), // only authorized roles can view reports
  eventsController.getAttendeesReport.bind(eventsController)
);
// Get event by ID (vendor only)
router.get(
  "/:eventId",
  authMiddleware,
  roleMiddleware([
    "vendor",
    "student",
    "staff",
    "ta",
    "professor",
    "admin",
    "events_office",
  ]),
  eventsController.getEventById.bind(eventsController)
);

// Register for event
router.post(
  "/:id/register",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.registerForEvent.bind(eventsController)
);

// Get registered users for a specific event (events_office only)
router.get(
  "/registered-users/:eventId",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.getEventRegisteredUsers.bind(eventsController)
);

// Export registered users for a specific event (events_office only)
// Supports query param ?format=xlsx|pdf|csv (default: xlsx)
router.get(
  "/export-registered/:eventId",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.exportEventRegisteredUsers.bind(eventsController)
);
// PATCH /events/:id/cancel
router.patch(
  "/:eventId/cancel",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.cancelEventRegistration.bind(eventsController)
);
// POST /events/:id/waitlist
router.post(
  "/:eventId/waitlist",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.joinWaitlist.bind(eventsController)
);
// GET /events/:id/waitlist/status - Check if user is on waitlist
router.get(
  "/:eventId/waitlist/status",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.checkWaitlistStatus.bind(eventsController)
);
// Get attendees count for an event
router.get(
  "/reports/attendees",
  authMiddleware,
  roleMiddleware(["events_office", "admin"]), // only authorized roles can view reports
  eventsController.getAttendeesReport.bind(eventsController)
);

router.patch(
  "/:id/restrict-access",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.restrictAccess.bind(eventsController)
);

router.get(
  "/reports/sales",
  authMiddleware,
  roleMiddleware(["events_office", "admin"]),
  eventsController.getSalesReport.bind(eventsController)
);

// Send workshop certificates to attendees (professor or events office only)
router.post(
  "/:workshopId/send-certificates",
  authMiddleware,
  roleMiddleware(["professor", "events_office"]),
  eventsController.sendWorkshopCertificates.bind(eventsController)
);

// Send certificates for all completed workshops (events office only)
router.post(
  "/send-all-certificates",
  authMiddleware,
  roleMiddleware(["events_office"]),
  eventsController.sendAllCompletedWorkshopCertificates.bind(eventsController)
);

// Manually trigger certificate scheduler job (events office/admin only)
router.post(
  "/trigger-certificate-job",
  authMiddleware,
  roleMiddleware(["events_office", "admin"]),
  eventsController.triggerCertificateScheduler.bind(eventsController)
);

// Add this BEFORE the /:eventId route to avoid conflicts
router.get(
  "/approved/count",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  eventsController.getApprovedEventsCount.bind(eventsController)
);
// ==========================================
// 🎟️ FEATURE 4: RESALE MARKET ROUTES
// ==========================================

// 1. List a ticket for resale (Seller Action)
// Only allowed for Student, Staff, TA, Professor
router.post(
  "/:id/resale/list",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  eventsController.listTicketForResale.bind(eventsController)
);

// 2. View available resale tickets for an event (Buyer Action)
router.get(
  "/:id/resale",
  authMiddleware,
  eventsController.getResaleTickets.bind(eventsController)
);

export default router;
