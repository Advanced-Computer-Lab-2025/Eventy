import { ApplicationService } from "./application.service.js";
import {
  validateBazaarApplication,
  validateBoothApplication,
} from "./application.validation.js";
import ApiError from "../../utils/ApiError.js";

export class ApplicationController {
  async applyToBazaar(req, res, next) {
    try {
      const vendorId = req.user._id;
      const eventId = req.params.eventId; // Get eventId from the path
      const user = req.user;

      // Validate input (body should NOT include event)
      // Expects: { attendees: [{ name, email, individualID (URL from /api/upload) }], boothSize }
      const { error } = validateBazaarApplication.validate(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body, // Includes attendees with individualID URLs
        event: eventId, // Set event from path param
        type: "bazaar",
        createdBy: vendorId,
      };

      const newApplication =
        await ApplicationService.createApplication(applicationDetails);

      res.status(201).json({
        success: true,
        message: "Bazaar application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      // Handle duplicate application errors specifically
      if (error.message && error.message.includes("already applied")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      // Handle other validation errors
      if (
        error.message &&
        error.message.includes("Could not create application")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Fallback for any other errors
      next(error);
    }
  }

  async applyToBooth(req, res, next) {
    try {
      const vendorId = req.user._id;

      // Validate input
      const { error } = validateBoothApplication.validate(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body,
        type: "booth",
        createdBy: vendorId,
      };

      const newApplication =
        await ApplicationService.createApplication(applicationDetails);

      res.status(201).json({
        success: true,
        message: "Booth application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      // Handle booth availability errors specifically
      if (
        error.message &&
        (error.message.includes("already reserved") ||
          (error.message.includes("booth") &&
            error.message.includes("reserved")))
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      // Handle other validation errors
      if (
        error.message &&
        error.message.includes("Could not create application")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Fallback for any other errors
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const vendorId = req.user._id;
      const filters = req.query; // Get filters from query string (e.g., ?status=approved)

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
          message:
            "Access denied. Only Admins or Events Office can update status.",
        });
      }

      // Only allow 'approved' or 'rejected'
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value. Must be 'approved' or 'rejected'.",
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

  async cancelApplication(req, res, next) {
    try {
      // Check for unauthorized access (401 Unauthorized)
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Check for wrong role (403 Forbidden)
      if (req.user.role !== "vendor") {
        throw new ApiError(403, "Only Vendors can cancel their applications.");
      }

      const { applicationId } = req.params;
      const vendorId = req.user._id;

      const cancelledApplication = await ApplicationService.cancelApplication(
        applicationId,
        vendorId
      );

      res.status(200).json({
        success: true,
        message: "Application cancelled successfully",
        data: cancelledApplication,
      });
    } catch (error) {
      // Handle ApiError instances (401, 403, etc.)
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      // Handle specific error cases
      if (
        error.message === "Application not found" ||
        error.message === "You can only cancel your own applications"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes("Payment has already been made") ||
        error.message.includes("Application has already been cancelled")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  }
}
