import logger from "../../utils/logger.js";
import { LoyaltyPartnerService } from "./loyaltyPartner.service.js";
import { applyLoyaltyProgramSchema } from "./loyaltyPartner.validation.js";

export const LoyaltyPartnerController = {
  async getStatus(req, res, _next) {
    try {
      const vendorId = req.user.id;
      const status =
        await LoyaltyPartnerService.getLoyaltyProgramStatus(vendorId);

      res.status(200).json({
        status: "success",
        data: status,
      });
    } catch (err) {
      logger.error("Error getting loyalty program status:", err);

      const statusCode = err.statusCode || 500;
      const message = err.message || "Failed to get loyalty program status";

      res.status(statusCode).json({
        status: "error",
        message: message,
      });
    }
  },

  async apply(req, res, _next) {
    try {
      // Step 1: Validate request body
      const { error } = applyLoyaltyProgramSchema.validate(req.body, {
        abortEarly: true,
      });
      if (error) {
        return res.status(422).json({ error: error.details[0].message });
      }
      const vendorId = req.user.id; // assuming JWT middleware adds req.user
      const newApplication = await LoyaltyPartnerService.applyLoyaltyProgram(
        vendorId,
        req.body
      );
      res.status(201).json({
        message: "Loyalty program application submitted successfully.",
        application: newApplication,
      });
    } catch (err) {
      logger.error(err);

      if (err.name === "ValidationError") {
        return res
          .status(422)
          .json({ status: "fail", message: err.details[0].message });
      }

      if (err.code === 11000) {
        // duplicate key error
        return res
          .status(409)
          .json({ status: "fail", message: "Duplicate entry detected." });
      }
      // Custom errors thrown in service (e.g., vendor already applied)
      if (err.message === "You already have an active loyalty program.") {
        return res.status(409).json({ status: "fail", message: err.message });
      }

      if (err.message === "Vendor not found.") {
        return res.status(404).json({ status: "fail", message: err.message });
      }
      // default server error
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async cancel(req, res) {
    try {
      const vendorId = req.user.id; // Get vendor ID from authenticated user
      const result = await LoyaltyPartnerService.cancelLoyaltyProgram(vendorId);

      res.status(200).json({
        status: "success",
        message: result.message,
        cancelledAt: result.cancelledAt,
      });
    } catch (err) {
      logger.error("Error cancelling loyalty program:", err);

      const statusCode = err.statusCode || 500;
      const message = err.message || "Failed to cancel loyalty program";

      res.status(statusCode).json({
        status: "error",
        message: message,
      });
    }
  },

  async getVendorStatus(req, res) {
    try {
      const vendorId = req.user.id; // Get vendor ID from authenticated user
      const status = await LoyaltyPartnerService.getVendorStatus(vendorId);

      res.status(200).json({
        status: "success",
        data: status,
      });
    } catch (err) {
      logger.error("Error getting vendor loyalty status:", err);

      const statusCode = err.statusCode || 500;
      const message = err.message || "Failed to get loyalty status";

      res.status(statusCode).json({
        status: "error",
        message: message,
      });
    }
  },

  async getPartners(req, res, _next) {
    try {
      const partners = await LoyaltyPartnerService.getApprovedLoyaltyPartners();

      res.status(200).json({
        status: "success",
        data: partners,
        count: partners.length,
      });
    } catch (err) {
      logger.error("Error fetching loyalty partners:", err);

      const statusCode = err.statusCode || 500;
      const message = err.message || "Failed to fetch loyalty partners";

      res.status(statusCode).json({
        status: "error",
        message: message,
      });
    }
  },
};
