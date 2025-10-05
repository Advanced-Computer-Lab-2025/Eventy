import { FacilitiesService } from "./facility.service.js";
import ApiError from "../../utils/ApiError.js";
import { createGymSessionSchema } from "./facility.validation.js";

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

  /**
   * Handles the request to create a new gym session.
   */
  async createGymSession(req, res, next) {
  try {

    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    
    if (req.user.role !== "events_office" && req.user.role !== "admin") {
      throw new ApiError(403, "Only Events Office or Admin can create gym sessions.");
    }
        
    const { error } = createGymSessionSchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message)

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
}