import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as eventService from "./event.service.js";
import { Event } from "./event.model.js";
import {
  createTripSchema,
  workshopStatusSchema,
  createWorkshopSchema,
  createConferenceSchema,
} from "./event.validation.js";

//Write your code in this class!!!

export class EventsController {
  async createBazaar(req, res, next) {
    try {
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

  async createTrip(req, res, next) {
    try {
      // 1️⃣ Validate request body
      const { error } = createTripSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      // 2️⃣ Call service
      const newTrip = await eventService.createTrip(req.body, req.user.id);

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
      if (req.user.role !== "professor") {
        return res
          .status(403)
          .json({ message: "Forbidden: Only professors can create workshops" });
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
        return res
          .status(403)
          .json({
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

  // Reject workshop
  async rejectWorkshop(req, res) {
    try {
      // Extra role validation
      if (req.user.role !== "events_office") {
        return res
          .status(403)
          .json({
            message: "Forbidden: Only events office can reject workshops",
          });
      }

      const { error } = workshopStatusSchema.validate({
        id: req.params.id,
        status: "rejected",
      });
      if (error)
        return res.status(400).json({ message: error.details[0].message });

      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      );

      if (!event) {
        return res.status(404).json({ message: "Workshop not found" });
      }

      res.status(200).json({ message: "Workshop rejected", event });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting workshop", error });
    }
  }
}
