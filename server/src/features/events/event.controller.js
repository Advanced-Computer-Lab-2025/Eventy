import { createTripSchema } from "./event.validation.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as eventService from "./event.service.js";

export class EventsController {
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
}

export default EventsController;
