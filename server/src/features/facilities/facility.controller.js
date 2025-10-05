import { FacilitiesService } from "./facility.service.js";

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
}