import { FacilitiesService } from "./facility.service.js";
import ApiError from "../../utils/ApiError.js";
import {
  createGymSessionSchema,
  gymSessionsQuerySchema,
  cancelGymSessionSchema,
  editGymSessionSchema,
  reserveCourtSchema,
  registerForGymSessionSchema,
} from "./facility.validation.js";

export class FacilitiesController {
  /**
   * Handles the request to get all court schedules.
   */
  async getCourtSchedules(req, res, next) {
    try {
      const schedules = await FacilitiesService.getCourtSchedules();

      res.status(200).json({
        success: true,
        message: "Court schedules retrieved successfully.",
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveCourt(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }
      if (req.user.role !== "student") {
        throw new ApiError(403, "Only students can reserve courts.");
      }
      const { error } = reserveCourtSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      const reservation = await FacilitiesService.reserveCourt(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Court reserved successfully.",
        data: reservation,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "This time slot is already booked",
        });
      }
      next(error);
    }
  }

  /**
   * Handles the request to get all gym sessions during a specific month and year.
   */
  async getGymSessions(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Only allow specific roles to view gym schedules
      const allowedRoles = [
        "student",
        "staff",
        "events_office",
        "ta",
        "professor",
      ];
      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          403,
          "Forbidden: You do not have permission to view gym schedules"
        );
      }

      const { error } = gymSessionsQuerySchema.validate(req.query);
      if (error) throw new ApiError(400, error.details[0].message);

      const { month, year } = req.query;
      const sessions = await FacilitiesService.getGymSessions(
        parseInt(month),
        parseInt(year)
      );

      res.status(200).json({
        success: true,
        message: "Gym sessions retrieved successfully.",
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles the request to create a new gym session.
   */
  async createGymSession(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office" && req.user.role !== "admin") {
        throw new ApiError(
          403,
          "Only Events Office or Admin can create gym sessions."
        );
      }

      const { error } = createGymSessionSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      const session = await FacilitiesService.createGymSession(req.body);

      res.status(201).json({
        success: true,
        message: "Gym session created successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles the request to cancel a gym session.
   */
  async cancelGymSession(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office") {
        throw new ApiError(403, "Only Events Office can cancel gym sessions.");
      }

      const { error } = cancelGymSessionSchema.validate({
        sessionId: req.params.sessionId,
      });
      if (error) throw new ApiError(400, error.details[0].message);

      const { sessionId } = req.params;
      const result = await FacilitiesService.cancelGymSession(sessionId);

      res.status(200).json({
        success: true,
        message: "Gym session cancelled successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles the request to edit a gym session.
   */
  async editGymSession(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (req.user.role !== "events_office") {
        throw new ApiError(403, "Only Events Office can edit gym sessions.");
      }

      const { error } = editGymSessionSchema.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);

      const { sessionId } = req.params;

      // Transform API fields to model fields
      const updates = {};
      if (req.body.date !== undefined) updates.date = req.body.date;
      if (req.body.time !== undefined) updates.startTime = req.body.time;
      if (req.body.duration !== undefined)
        updates.durationMinutes = req.body.duration;

      const result = await FacilitiesService.editGymSession(sessionId, updates);

      res.status(200).json({
        success: true,
        message: "Gym session updated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerForGymSession(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Only allow specific roles to view gym schedules
      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          403,
          "Forbidden: You do not have permission to view gym schedules"
        );
      }
      const { error } = registerForGymSessionSchema.validate(req.params);
      if (error) throw new ApiError(400, error.details[0].message);

      const { sessionId } = req.params;
      const session = await FacilitiesService.registerForGymSession(
        sessionId,
        req.user.id
      );
      res.status(200).json({
        success: true,
        message: "Registered for gym session successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
}
