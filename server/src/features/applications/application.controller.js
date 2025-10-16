import { ApplicationService } from "./application.service.js";
import {
  validateBazaarApplication,
  validateBoothApplication,
} from "./application.validation.js";

export class ApplicationController {
  async applyToBazaar(req, res, next) {
    try {
      const vendorId = req.user._id;
      const eventId = req.params.eventId; // Get eventId from the path

      // Validate input (body should NOT include event)
      const { error } = validateBazaarApplication(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body,
        vendorId,
        event: eventId, // Set event from path param
        type: "bazaar",
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Bazaar application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      next(error);
    }
  }

  async applyToBooth(req, res, next) {
    try {
      const vendorId = req.user._id;
      // Validate input
      const { error } = validateBoothApplication(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body,
        vendorId,
        type: "booth",
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Booth application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
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
        if (!["admin", "events_office"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admins or Events Office can update status.",
      });
    }

      // Only allow 'accepted' or 'rejected'
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value. Must be 'accepted' or 'rejected'.",
        });
      }

      const updatedApplication =
        await ApplicationService.updateApplicationStatus(applicationId, status);

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
