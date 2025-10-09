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
  async updateApplicationStatus(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Only allow 'accepted' or 'rejected'
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be 'accepted' or 'rejected'.",
      });
    }

    const updatedApplication = await ApplicationService.updateApplicationStatus(
      applicationId,
      status
    );

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}.`,
      data: updatedApplication,
    });
  } catch (error) {
    if (error.message === "Application not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

  static async getAllApplications(req, res, next) {
    try {
      // Optional: Only allow Events Office or Admin
      if (!req.user || !["events_office", "admin"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const applications = await ApplicationService.getAllApplications();

      res.status(200).json({
        success: true,
        message: "All applications fetched successfully",
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }
}
