import { ApplicationService } from "./application.service.js";

export class ApplicationController {
  async applyToBazaar(req, res, next) {
    try {
      // Get the vendor's ID from the mock auth middleware.
      // Your real auth middleware should also provide req.user._id.
      const vendorId = req.user._id;

      const applicationDetails = {
        ...req.body,
        vendorId,
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      // Pass any errors from the service to the centralized errorMiddleware
      next(error);
    }
  }
  async getMyApplications(req, res, next) {
    try {
      const vendorId = req.user._id;
      const filters = req.query; // Get filters from query string (e.g., ?status=accepted)

      const applications = await ApplicationService.findVendorApplications(
        vendorId,
        filters
      );

      res.status(200).json({
        success: true,
        message: "Applications retrieved successfully.",
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBazaarApplications(req, res, next) {
  try {
    const { bazaarId } = req.params;

    // ✅ Use the service you already have
    const applications = await ApplicationService.getApplicationsForBazaar(bazaarId);

    res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
}

}
