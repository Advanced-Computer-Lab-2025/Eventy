import { FacilitiesService } from "./facility.service.js";
import  ApiError  from "../../utils/ApiError.js";
import { gymSessionsQuerySchema } from "./facility.validation.js";

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
   * Handles the request to get all gym sessions during a specific month and year.
   */
  async getGymSessions(req, res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
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
}