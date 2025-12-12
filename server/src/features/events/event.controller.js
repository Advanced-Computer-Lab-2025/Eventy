import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as eventService from "./event.service.js";
import {
  syncEventToGoogleCalendar,
  removeEventFromGoogleCalendar,
} from "./calendar.sync.js";
import { Event } from "./event.model.js";
import {
  createTripSchema,
  workshopStatusSchema,
  createWorkshopSchema,
  createConferenceSchema,
  createBazaarSchema,
  updateBazaarSchema,
  updateConferenceSchema,
  updateWorkshopSchema,
  getAttendeesReportSchema,
  restrictAccessSchema,
  getSalesReportSchema,
} from "./event.validation.js";
import { User } from "../users/user.model.js";
import NotificationService from "../notifications/notification.service.js";

//Write your code in this class!!!

export class EventsController {
  async createBazaar(req, res, next) {
    try {
      const { error } = createBazaarSchema.validate(req.body);
      if (error) throw new ApiError(400, error.message);

      const data = req.body;
      const user = req.user;

      const bazaar = await eventService.createBazaar(data, user);

      return res
        .status(201)
        .json(new ApiResponse(201, bazaar, "Bazaar created successfully"));
    } catch (err) {
      console.error("Error in createBazaar controller:", err);
      next(new ApiError(400, err.message));
    }
  }

  async getWorkshopParticipants(req, res, next) {
    try {
      const { workshopId } = req.params;
      const userId = req.user._id || req.user.id;
      // Find the workshop and ensure professor is creator
      const workshop = await eventService.getWorkshopById(workshopId);
      if (!workshop) throw new ApiError(404, "Workshop not found");
      if (workshop.eventType !== "workshop")
        throw new ApiError(400, "Not a workshop");
      if (String(workshop.createdBy) !== String(userId))
        throw new ApiError(
          403,
          "Forbidden: Only the creator professor can view participants"
        );
      // Populate attendees
      await workshop.populate("attendees", "firstName lastName email");
      const participants = (workshop.attendees || []).map((attendee) => ({
        _id: attendee._id,
        name: `${attendee.firstName} ${attendee.lastName}`,
        email: attendee.email,
      }));
      const remainingSpots = (workshop.capacity || 0) - participants.length;
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { participants, remainingSpots },
            "Participants and remaining spots fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  async updateTripController(req, res, next) {
    try {
      const { tripId } = req.params;
      const updatedTrip = await eventService.updateTripService(
        tripId,
        req.body,
        req.user
      );

      res
        .status(200)
        .json(new ApiResponse(200, updatedTrip, "Trip updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  async editBazaar(req, res, next) {
    try {
      const { id } = req.params;

      // Validate input
      const { error } = updateBazaarSchema.validate(req.body);
      if (error) throw new ApiError(400, error.message);

      // Update bazaar via service
      const updatedBazaar = await eventService.editBazaar(id, req.body);

      // Send response
      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedBazaar, "Bazaar updated successfully")
        );
    } catch (err) {
      console.error("Error editing bazaar:", err);
      next(err);
    }
  }

  async createConferenceController(req, res, next) {
    try {
      // 🧩 Validate request body
      const { error } = createConferenceSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      // Check professors are active
      const professorIds = req.body.professors;
      const activeProfessors = await User.find({
        _id: { $in: professorIds },
        role: "professor",
        status: "active", // Only active professors
        deletedAt: null, // Not soft deleted
      }).select("_id");

      if (activeProfessors.length !== professorIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "All professors must be active and not pending, blocked, or deleted.",
        });
      }

      const userId = req.user.id;
      const newConference = await eventService.createConference(
        req.body,
        userId
      );

      res
        .status(201)
        .json(
          new ApiResponse(201, newConference, "Conference created successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  async getConferencesController(req, res, next) {
    try {
      const conferences = await eventService.getConferences();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            conferences,
            "Conferences retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  async getConferenceByIdController(req, res, next) {
    try {
      const { conferenceId } = req.params;
      const conference = await eventService.getConferenceById(conferenceId);

      return res
        .status(200)
        .json(
          new ApiResponse(200, conference, "Conference retrieved successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  async updateConferenceController(req, res, next) {
    try {
      const { error } = updateConferenceSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      // Check professors are active if professors are being updated
      if (req.body.professors) {
        const professorIds = req.body.professors;
        const activeProfessors = await User.find({
          _id: { $in: professorIds },
          role: "professor",
          status: "active", // Only active professors
          deletedAt: null, // Not soft deleted
        }).select("_id");

        if (activeProfessors.length !== professorIds.length) {
          return res.status(400).json({
            success: false,
            message:
              "All professors must be active and not pending, blocked, or deleted.",
          });
        }
      }

      const { conferenceId } = req.params;
      const updatedConference = await eventService.updateConferenceService(
        conferenceId,
        req.body,
        req.user
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedConference,
            "Conference updated successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  async createTrip(req, res, next) {
    try {
      // 1️⃣ Validate request body
      const { error } = createTripSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);
      const userId = req.user._id || req.user.id;
      // 2️⃣ Call service
      const newTrip = await eventService.createTrip(req.body, userId);

      // 3️⃣ Send success response
      return res
        .status(201)
        .json(new ApiResponse(201, newTrip, "Trip created successfully"));
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req, res, next) {
    try {
      // Only allow access to authenticated users with 'vendor' role
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }
      if (req.user.role !== "vendor") {
        throw new ApiError(
          403,
          "Forbidden: Only vendors can access this endpoint"
        );
      }

      // Filter by type=bazaar if provided
      const { type } = req.query;
      let filter = {};
      if (type === "bazaar") {
        filter = {
          eventType: "bazaar",
          status: "approved",
          startDate: { $gte: new Date() },
          deletedAt: null, // Exclude soft-deleted bazaars
        };
      }

      const events = await eventService.getEvents(filter);
      return res
        .status(200)
        .json(new ApiResponse(200, events, "Events fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  async createWorkshop(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "professor") {
        throw new ApiError(
          403,
          "Forbidden: Only professors can create workshops"
        );
      }

      const { error } = createWorkshopSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      // Check professors are active
      const professorIds = req.body.professors;
      const activeProfessors = await User.find({
        _id: { $in: professorIds },
        role: "professor",
        status: "active", // Only active professors
        deletedAt: null, // Not soft deleted
      }).select("_id");

      if (activeProfessors.length !== professorIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "All professors must be active and not pending, blocked, or deleted.",
        });
      }

      const newWorkshop = await eventService.createWorkshop(
        req.body,
        req.user.id
      );

      // Create notification for Events Office users
      try {
        const eventsOfficeUsers = await User.find({
          role: "events_office",
          status: "active",
          deletedAt: null,
        }).select("_id firstName lastName");

        if (eventsOfficeUsers.length > 0) {
          await NotificationService.createNotification({
            recipients: eventsOfficeUsers.map((u) => u._id),
            title: "New Workshop Submission",
            message: `${req.user.firstName || "Professor"} submitted a workshop: ${req.body.name}`,
            link: "/approvals/workshops",
          });
        }
      } catch (notifErr) {
        // Log but do not fail the main request
        console.error(
          "Failed to create notification for workshop submission",
          notifErr
        );
      }

      return res
        .status(201)
        .json(
          new ApiResponse(201, newWorkshop, "Workshop created successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  async viewAllWorkshops(req, res, next) {
    try {
      // ✅ 1. Check authentication
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // ✅ 2. Allow only Admin or Events Office roles
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Admin or Events Office can view all workshops"
        );
      }

      // ✅ 3. Call service layer
      const workshops = await eventService.getAllWorkshopsService(
        req.user.role
      );

      // ✅ 4. Return success response
      return res
        .status(200)
        .json(
          new ApiResponse(200, workshops, "Workshops retrieved successfully")
        );
    } catch (err) {
      // ✅ 5. Pass errors to global handler
      next(err);
    }
  }

  async getMyWorkshops(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "professor") {
        throw new ApiError(
          403,
          "Forbidden: Only professors can view their workshops"
        );
      }

      const userId = req.user._id || req.user.id;
      const events = await eventService.getEvents({
        eventType: "workshop",
        createdBy: userId,
        deletedAt: null,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Workshops fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  async acceptWorkshop(req, res, next) {
    try {
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only events office can accept workshops"
        );
      }

      const { error } = workshopStatusSchema.validate({
        id: req.params.id,
        status: "approved",
      });
      if (error) throw new ApiError(400, error.details[0].message);

      const event = await eventService.acceptWorkshop(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, event, "Workshop approved and published"));
    } catch (error) {
      next(error);
    }
  }

  async approveBazaar(req, res, next) {
    try {
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only events office can approve bazaars"
        );
      }

      const event = await eventService.approveBazaar(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, event, "Bazaar approved and published"));
    } catch (error) {
      next(error);
    }
  }

  async rejectWorkshop(req, res, next) {
    try {
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only events office can reject workshops"
        );
      }

      const { error } = workshopStatusSchema.validate({
        id: req.params.id,
        status: "rejected",
      });
      if (error) throw new ApiError(400, error.details[0].message);

      const event = await eventService.rejectWorkshop(req.params.id);

      res.status(200).json(new ApiResponse(200, event, "Workshop rejected"));
    } catch (error) {
      next(error);
    }
  }

  async requestEdits(req, res, next) {
    try {
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only events office can request edits"
        );
      }

      const { revisionComments } = req.body;
      if (!revisionComments?.trim()) {
        throw new ApiError(
          400,
          "Comments are required to specify what needs to be edited"
        );
      }

      const event = await eventService.requestWorkshopEdits(
        req.params.id,
        revisionComments
      );

      res
        .status(200)
        .json(new ApiResponse(200, event, "Edit request sent successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to handle editing a workshop.
   */
  async editWorkshop(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "professor") {
        throw new ApiError(
          403,
          "Forbidden: Only professors can edit workshops"
        );
      }
      // Get the workshop ID from URL parameters
      const { workshopId } = req.params;

      // Validate the request body against the schema
      const { error } = updateWorkshopSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      // Call the service to perform the update logic
      const updatedWorkshop = await eventService.editWorkshop(
        workshopId,
        req.body,
        req.user
      );

      // Send a successful response
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedWorkshop,
            "Workshop updated successfully and is now pending re-approval"
          )
        );
    } catch (err) {
      // Pass errors to the central error handler
      next(err);
    }
  }

  //Rana (to be deleted later)
  //Register for event (workshop/trip)
  async registerForEvent(req, res) {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const user = req.user; // expects at least { _id, role, ... }
      const eventId = req.params.id;

      const updatedEvent = await eventService.registerUserToEvent(
        user,
        eventId
      );

      // 🔄 AUTO-SYNC: Sync to Google Calendar if user has it connected
      let calendarSyncResult = { synced: false };
      if (user._id && eventId) {
        try {
          calendarSyncResult = await syncEventToGoogleCalendar(
            user._id,
            eventId
          );
          if (calendarSyncResult.synced && calendarSyncResult.googleEventId) {
            console.log("✅ Event auto-synced to Google Calendar");
            // Save the Google Event ID per user to the event document
            const event = await Event.findById(eventId);
            if (event) {
              // Store googleEventId per user in the googleCalendarEvents array
              event.googleCalendarEvents = event.googleCalendarEvents || [];
              const existingIndex = event.googleCalendarEvents.findIndex(
                (item) => item.userId.toString() === user._id.toString()
              );
              if (existingIndex >= 0) {
                event.googleCalendarEvents[existingIndex].googleEventId =
                  calendarSyncResult.googleEventId;
              } else {
                event.googleCalendarEvents.push({
                  userId: user._id,
                  googleEventId: calendarSyncResult.googleEventId,
                  htmlLink: calendarSyncResult.htmlLink,
                });
              }
              await event.save();
            }
          } else {
            console.log("ℹ️ Calendar sync skipped:", calendarSyncResult.reason);
          }
        } catch (syncError) {
          // Don't fail registration if calendar sync fails
          console.warn(
            "⚠️ Calendar sync error (non-blocking):",
            syncError.message
          );
        }
      }

      // Return the updated event so the client can update UI without refetch
      return res.status(200).json({
        message: "Successfully registered for the event.",
        event: updatedEvent,
        calendarSynced: calendarSyncResult.synced,
      });
    } catch (err) {
      // If the service threw an error object with statusCode, use it
      if (err && err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      // General fallback
      console.error("registerForEvent error:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  // Get all events the logged-in user registered for
  async getMyEvents(req, res, next) {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Get the user ID from auth middleware
      const userId = req.user._id || req.user.id;
      // Fetch events the user is registered for
      const events = await eventService.getEventsByUser(userId);

      // Send response
      return res
        .status(200)
        .json(
          new ApiResponse(200, events, "Registered events fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Delete an event controller
  async deleteEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const user = req.user;

      await eventService.deleteEvent(eventId, user);

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  // /api/events/upcoming
  async getUpcomingEvents(req, res, next) {
    try {
      const userRole = req.user?.role;
      const events = await eventService.getUpcomingEventsWithVendors(
        true,
        userRole
      );
      return res
        .status(200)
        .json(
          new ApiResponse(200, events, "Upcoming events fetched successfully.")
        );
    } catch (err) {
      next(err);
    }
  }

  async getOngoingEvents(req, res, next) {
    try {
      const userRole = req.user?.role;
      const events = await eventService.getOngoingEvents(userRole);
      return res
        .status(200)
        .json(
          new ApiResponse(200, events, "Ongoing events fetched successfully.")
        );
    } catch (err) {
      next(err);
    }
  }

  //search events by name and type
  //  Search events by name (event/professor) or type
  async searchEvents(req, res, next) {
    try {
      const { name, type, location, startDate, endDate, professor } = req.query;

      // Ensure at least one search parameter is provided (allow professor only searches too)
      if (!name && !type && !location && !startDate && !endDate && !professor) {
        throw new ApiError(
          400,
          "Please provide at least one search criteria (name, type, location, professor, or date range)."
        );
      }

      let parsedStartDate = null;
      let parsedEndDate = null;

      if (startDate || endDate) {
        if (!startDate || !endDate) {
          throw new ApiError(
            400,
            "Please provide both startDate and endDate when filtering by date."
          );
        }

        const maybeStart = new Date(startDate);
        const maybeEnd = new Date(endDate);

        if (
          Number.isNaN(maybeStart.getTime()) ||
          Number.isNaN(maybeEnd.getTime())
        ) {
          throw new ApiError(400, "Invalid date format.");
        }

        if (maybeStart > maybeEnd) {
          throw new ApiError(
            400,
            "startDate cannot be later than endDate for date range filtering."
          );
        }

        parsedStartDate = maybeStart;
        parsedEndDate = maybeEnd;
      }

      const userRole = req.user?.role;

      // Delegate filter construction and search to the service
      const events = await eventService.searchEvents({
        name,
        type,
        location,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        userRole,
        professor,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Events search successful"));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/events/past - returns events whose endDate is before or equal to now
  // For platform booths, both startDate and endDate must have passed
  async getPastEvents(req, res, next) {
    try {
      // Require authenticated user (role middleware on route will enforce role)
      if (!req.user) throw new ApiError(401, "Unauthorized");

      // Use end of today for comparison so events ending today are included
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      // Use service.getEvents with a filter for events that have ended
      // For platform booths, we need both startDate and endDate to have passed
      const events = await eventService.getEvents({
        status: "approved",
        deletedAt: null,
        endDate: { $lte: now }, // End date has passed
        startDate: { $lte: now }, // Start date has also passed (for platform booths)
      });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Past events fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/events/archived - returns all archived events
  async getArchivedEvents(req, res, next) {
    try {
      // Require authenticated user (role middleware on route will enforce role)
      if (!req.user) throw new ApiError(401, "Unauthorized");

      // Get all archived events
      const events = await eventService.getEvents({
        status: "archived",
        deletedAt: null,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, events, "Archived events fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  async getEventById(req, res, next) {
    try {
      const { eventId } = req.params;
      const userRole = req.user?.role;
      const event = await eventService.getEventById(eventId, userRole);
      return res
        .status(200)
        .json(new ApiResponse(200, event, "Event fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  async getAllTrips(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;

      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Events Office can view all trips"
        );
      }

      const trips = await eventService.getAllTripsService();

      return res
        .status(200)
        .json(new ApiResponse(200, trips, "Trips retrieved successfully"));
    } catch (err) {
      next(err);
    }
  }

  async getAttendeesReport(req, res, next) {
    try {
      // ✅ Validate query params
      const { error, value } = getAttendeesReportSchema.validate(req.query, {
        abortEarly: false,
      });

      if (error)
        return next(new ApiError(400, "Validation failed", error.details));

      // ✅ Use the validated values
      const { name, eventType, startDate, endDate, page, limit } = value;

      const report = await eventService.getAttendeesReport({
        name,
        eventType,
        startDate,
        endDate,
        page: page || 1,
        limit: limit || 10,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            report,
            "Attendees report generated successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  // Archive an event (only after event endDate has passed)
  async archiveEvent(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Events Office can archive events"
        );
      }

      const event = await eventService.archiveEvent(req.params.id, req.user);

      return res
        .status(200)
        .json(new ApiResponse(200, event, "Event archived successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Unarchive an event (restore to approved status)
  async unarchiveEvent(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Events Office can unarchive events"
        );
      }

      const event = await eventService.unarchiveEvent(req.params.id, req.user);

      return res
        .status(200)
        .json(new ApiResponse(200, event, "Event unarchived successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get all registered users for an event (name and role only)
  async getEventRegisteredUsers(req, res, next) {
    try {
      // Authentication check
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Authorization: only events_office can view registered users lists
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Events Office can view event registered users"
        );
      }

      const { eventId } = req.params;
      const registeredUsers =
        await eventService.getEventRegisteredUsers(eventId);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            registeredUsers,
            "Event registered users fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  // Cancel event registration (for Student/Staff/TA/Professor)
  async cancelEventRegistration(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { eventId } = req.params;

      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      // Allow only student/staff/ta/professor
      if (!["student", "staff", "ta", "professor"].includes(req.user.role)) {
        throw new ApiError(
          403,
          "Only registered users can cancel their registrations."
        );
      }

      const result = await eventService.cancelEventRegistration(
        eventId,
        userId
      );

      // Remove event from Google Calendar when registration is cancelled
      // Get the event to find the user's specific Google event ID
      const event = await Event.findById(eventId);

      if (
        event?.googleCalendarEvents &&
        event.googleCalendarEvents.length > 0
      ) {
        // Find the Google event ID for this specific user
        const userCalendarEvent = event.googleCalendarEvents.find(
          (item) => item.userId.toString() === userId.toString()
        );

        if (userCalendarEvent?.googleEventId) {
          await removeEventFromGoogleCalendar(
            userId,
            userCalendarEvent.googleEventId
          ).catch((err) => {
            console.warn(
              `Warning: Could not remove event from Google Calendar: ${err.message}`
            );
            // Don't throw error - registration cancellation should succeed even if calendar removal fails
          });

          // Remove the calendar entry for this user from the event
          event.googleCalendarEvents = event.googleCalendarEvents.filter(
            (item) => item.userId.toString() !== userId.toString()
          );
          await event.save();
        }
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Registration cancelled and amount refunded."
          )
        );
    } catch (err) {
      next(err);
    }
  }

  // Join waitlist for an event (for Student/Staff/TA/Professor)
  async joinWaitlist(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { eventId } = req.params;
      const { autopayEnabled, paymentMethod } = req.body;

      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      // Allow only student/staff/ta/professor
      if (!["student", "staff", "ta", "professor"].includes(req.user.role)) {
        throw new ApiError(
          403,
          "Only students, staff, TAs, and professors can join waitlists."
        );
      }

      const waitlistEntry = await eventService.joinWaitlist(
        eventId,
        userId,
        autopayEnabled || false,
        paymentMethod || null
      );

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            waitlistEntry,
            "Successfully joined the waitlist."
          )
        );
    } catch (err) {
      next(err);
    }
  }

  // Check waitlist status for an event (for Student/Staff/TA/Professor)
  async checkWaitlistStatus(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { eventId } = req.params;

      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      const waitlistEntry = await eventService.checkWaitlistStatus(
        eventId,
        userId
      );

      return res.status(200).json(
        new ApiResponse(200, {
          isOnWaitlist: !!waitlistEntry,
          waitlistEntry: waitlistEntry || null,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  // Export registered users for an event in various formats
  async exportEventRegisteredUsers(req, res, next) {
    try {
      // Authentication check
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Authorization: only events_office can export registered users
      if (req.user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only Events Office can export registered users"
        );
      }

      const { eventId } = req.params;
      const { format = "xlsx" } = req.query; // Default to xlsx if not specified

      const { buffer, filename, mimeType } =
        await eventService.exportEventRegisteredUsers(eventId, format);

      // Set headers for file download
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", buffer.length);

      // Send the file buffer
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async restrictAccess(req, res, next) {
    try {
      // Check authentication
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Validate request body
      const { error } = restrictAccessSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      // Call service to restrict access
      const event = await eventService.restrictAccess(
        req.params.id,
        req.body.roles,
        req.user
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            event,
            "Event access restrictions updated successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  async getSalesReport(req, res, next) {
    try {
      // ✅ Validate query params
      const { error, value } = getSalesReportSchema.validate(req.query, {
        abortEarly: false,
      });

      if (error)
        return next(new ApiError(400, "Validation failed", error.details));

      // ✅ Use the validated values
      const { eventType, startDate, endDate, sortOrder, page, limit, format } =
        value;

      // Check if export format is requested
      if (format && format.toLowerCase() === "xlsx") {
        // Export as formatted Excel file
        const { buffer, filename, mimeType } =
          await eventService.exportSalesReport({
            eventType,
            startDate,
            endDate,
            sortOrder: sortOrder || "desc",
            format: "xlsx",
          });

        // Set headers for file download
        res.setHeader("Content-Type", mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", buffer.length);

        // Send the file buffer
        return res.send(buffer);
      }

      // Regular JSON response
      const report = await eventService.getSalesReport({
        eventType,
        startDate,
        endDate,
        sortOrder: sortOrder || "desc",
        page: page || 1,
        limit: limit || 10,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, report, "Sales report generated successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send workshop attendance certificates to attendees
   * Only works for workshops that have ended
   * POST /api/events/:workshopId/send-certificates
   */
  async sendWorkshopCertificates(req, res, next) {
    try {
      const { workshopId } = req.params;
      const user = req.user;

      // Check user role - only professors and events office can send certificates
      if (!["professor", "events_office"].includes(user.role)) {
        throw new ApiError(
          403,
          "Forbidden: Only professors and events office can send certificates"
        );
      }

      // If professor, verify they created this workshop
      if (user.role === "professor") {
        const workshop = await eventService.getWorkshopById(workshopId);
        if (!workshop) {
          throw new ApiError(404, "Workshop not found");
        }
        if (String(workshop.createdBy) !== String(user._id)) {
          throw new ApiError(
            403,
            "Forbidden: You can only send certificates for workshops you created"
          );
        }
      }

      const result = await eventService.sendWorkshopCertificates(workshopId);

      return res.status(200).json(new ApiResponse(200, result, result.message));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send certificates for all completed workshops
   * Only accessible by events office
   * POST /api/events/send-all-certificates
   */
  async sendAllCompletedWorkshopCertificates(req, res, next) {
    try {
      const user = req.user;

      // Only events office can trigger batch certificate sending
      if (user.role !== "events_office") {
        throw new ApiError(
          403,
          "Forbidden: Only events office can send certificates for all workshops"
        );
      }

      const result = await eventService.sendCertificatesForCompletedWorkshops();

      return res.status(200).json(new ApiResponse(200, result, result.message));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually trigger the certificate scheduler job
   * Only accessible by events office or admin
   * POST /api/events/trigger-certificate-job
   */
  async triggerCertificateScheduler(req, res, next) {
    try {
      const user = req.user;

      // Only events office and admin can manually trigger the job
      if (!["events_office", "admin"].includes(user.role)) {
        throw new ApiError(
          403,
          "Forbidden: Only events office and admin can trigger the certificate scheduler"
        );
      }

      // Import the scheduler function
      const { triggerCertificateJobManually } = await import(
        "../../utils/certificate-scheduler.js"
      );

      // Trigger the job manually
      await triggerCertificateJobManually();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { triggered: true },
            "Certificate scheduler job triggered successfully. Check server logs for results."
          )
        );
    } catch (err) {
      next(err);
    }
  }

  async getApprovedEventsCount(req, res, next) {
    try {
      // ✅ Import the service function instead of using Event directly
      const count = await eventService.getApprovedEventsCount();

      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Error counting approved events:", error);
      next(error);
    }
  }

  // POST /api/events/:id/resale/list
  async listTicketForResale(req, res, next) {
    try {
      if (!req.user) throw new ApiError(401, "Unauthorized");

      const eventId = req.params.id;
      const userId = req.user._id || req.user.id;

      const result = await eventService.listTicketForResale(eventId, userId);

      return res.status(200).json(new ApiResponse(200, result, result.message));
    } catch (err) {
      next(err);
    }
  }

  async recordView(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user._id;

      await User.findByIdAndUpdate(userId, {
        $addToSet: { viewedEvents: eventId },
      });

      // Increment global view count for the event
      await eventService.incrementViewCount(eventId);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error recording view:", error);
      // Don't block the UI for this background task
      return res.status(200).json({ success: false });
    }
  }

  async uploadImageToEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user._id || req.user.id;

      if (!req.file) {
        throw new ApiError(400, "Image file is required");
      }

      // Construct the public URL for the uploaded image
      const relativePath = `/uploads/event-images/${req.file.filename}`;
      const protocol = req.protocol;
      const host = req.get("host");
      const imageUrl = `${protocol}://${host}${relativePath}`;

      const updatedEvent = await eventService.uploadImageToEvent(
        eventId,
        userId,
        imageUrl
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            event: updatedEvent,
            imageUrl: imageUrl,
          },
          "Image uploaded successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // GET /api/events/:id/resale
  async getResaleTickets(req, res, next) {
    try {
      const eventId = req.params.id;
      const tickets = await eventService.getResaleTickets(eventId);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            tickets,
            "Available resale tickets fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  async getEventImages(req, res, next) {
    try {
      const { eventId } = req.params;

      const user = req.user || null;
      const imageData = await eventService.getEventImages(eventId, user);

      return res
        .status(200)
        .json(
          new ApiResponse(200, imageData, "Event images fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }
  async getMarketplace(req, res, next) {
    try {
      const tickets = await eventService.getAllResaleTickets();
      return res
        .status(200)
        .json(new ApiResponse(200, tickets, "Marketplace listings fetched"));
    } catch (err) {
      next(err);
    }
  }
}
