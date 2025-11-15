import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as eventService from "./event.service.js";
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
} from "./event.validation.js";
import { User } from "../users/user.model.js"; // adjust path if needed

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

      await eventService.registerUserToEvent(user, eventId);

      return res
        .status(200)
        .json({ message: "Successfully registered for the event." });
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
      const events = await eventService.getUpcomingEventsWithVendors(true);
      return res
        .status(200)
        .json(
          new ApiResponse(200, events, "Upcoming events fetched successfully.")
        );
    } catch (err) {
      next(err);
    }
  }
  //search events by name and type
  //  Search events by name (event/professor) or type
  async searchEvents(req, res, next) {
    try {
      const { name, type } = req.query;

      // Ensure at least one search parameter is provided
      if (!name && !type) {
        throw new ApiError(400, "Please provide a name or type to search.");
      }

      // Delegate filter construction and search to the service
      const events = await eventService.searchEvents({ name, type });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Events search successful"));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/events/past - returns events whose endDate is before or equal to now
  async getPastEvents(req, res, next) {
    try {
      // Require authenticated user (role middleware on route will enforce role)
      if (!req.user) throw new ApiError(401, "Unauthorized");

      const now = new Date();

      // Use service.getEvents with a filter for events that have ended
      const events = await eventService.getEvents({
        endDate: { $lte: now },
        deletedAt: null,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Past events fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  async getEventById(req, res, next) {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEventById(eventId);
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
      const { eventType, startDate, endDate, page, limit } = value;

      const report = await eventService.getAttendeesReport({
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
}
