import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as eventService from "./event.service.js";
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
} from "./event.validation.js";

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
          new ApiResponse(200, conferences, "Conferences retrieved successfully")
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

      // 2️⃣ Call service
      const newTrip = await eventService.createTrip(req.body, req.user._id);

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

      const newWorkshop = await eventService.createWorkshop(
        req.body,
        req.user._id
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

  // Accept workshop
  async acceptWorkshop(req, res) {
    try {
      // Extra role validation
      if (req.user.role !== "events_office") {
        return res.status(403).json({
          message: "Forbidden: Only events office can accept workshops",
        });
      }

      const { error } = workshopStatusSchema.validate({
        id: req.params.id,
        status: "approved",
      });
      if (error)
        return res.status(400).json({ message: error.details[0].message });

      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
      );

      if (!event) {
        return res.status(404).json({ message: "Workshop not found" });
      }

      res
        .status(200)
        .json({ message: "Workshop accepted and published", event });
    } catch (error) {
      res.status(500).json({ message: "Error accepting workshop", error });
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

      const events = await eventService.getEvents({
        eventType: "workshop",
        createdBy: req.user._id,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, events, "Workshops fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ...existing code...

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
        .json(new ApiResponse(200, event, "Workshop accepted and published"));
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
      return res.status(500).json({ message: "Internal server error" });
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
      const userId = req.user._id;

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
  async getUpcomingEvents(req, res, next) {
    try {
      const events = await eventService.getUpcomingEventsService();
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
}
