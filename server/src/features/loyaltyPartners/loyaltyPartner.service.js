import { LoyaltyPartner } from "./loyaltyPartner.model.js";
import { User } from "../users/user.model.js";

export const LoyaltyPartnerService = {
  async applyLoyaltyProgram(vendorId, data) {
    // Check if vendor already has an active loyalty program
    const existing = await LoyaltyPartner.findOne({
      vendorId,
      status: "active",
    });
    if (existing) {
      const err = new Error("You already have an active loyalty program.");
      err.statusCode = 409;
      throw err;
    }

    // Check if vendor has a cancelled program and update it instead of creating new
    const cancelledProgram = await LoyaltyPartner.findOne({
      vendorId,
      status: "cancelled",
    });

    if (cancelledProgram) {
      // Update the cancelled program with new details
      cancelledProgram.status = "active";
      cancelledProgram.discountRate = data.discountRate;
      cancelledProgram.promoCode = data.promoCode;
      cancelledProgram.termsAndConditions = data.termsAndConditions;
      cancelledProgram.expiryDate = data.expiryDate;
      cancelledProgram.deletedAt = null; // Remove cancellation timestamp

      await cancelledProgram.save();
      return cancelledProgram;
    }

    // Optionally fetch vendor name from User model
    const vendor = await User.findById(vendorId);
    if (!vendor) {
      const err = new Error("Vendor not found.");
      err.statusCode = 404;
      throw err;
    }

    const vendorName = vendor.companyName || "Unknown Vendor";

    const newApplication = await LoyaltyPartner.create({
      vendorId,
      vendorName,
      discountRate: data.discountRate,
      promoCode: data.promoCode,
      termsAndConditions: data.termsAndConditions,
      expiryDate: data.expiryDate,
    });

    return newApplication;
  },

  async cancelLoyaltyProgram(vendorId) {
    // Find the active loyalty program for the vendor
    const existing = await LoyaltyPartner.findOne({
      vendorId,
      status: "active",
    });

    if (!existing) {
      const err = new Error("No active loyalty program found to cancel.");
      err.statusCode = 404;
      throw err;
    }

    // Update status to cancelled
    existing.status = "cancelled";

    await existing.save();

    return {
      message: "Successfully cancelled loyalty program participation",
      cancelledAt: existing.deletedAt,
    };
  },

  async getVendorStatus(vendorId) {
    const loyaltyPartner = await LoyaltyPartner.findOne({ vendorId });

    if (!loyaltyPartner) {
      return { hasParticipation: false, status: null };
    }

    return {
      hasParticipation: true,
      status: loyaltyPartner.status,
      details: {
        discountRate: loyaltyPartner.discountRate,
        promoCode: loyaltyPartner.promoCode,
        termsAndConditions: loyaltyPartner.termsAndConditions,
        expiryDate: loyaltyPartner.expiryDate,
      },
    };
  },
};
