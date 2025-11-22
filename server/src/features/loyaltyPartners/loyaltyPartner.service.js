import { LoyaltyPartner } from "./loyaltyPartner.model.js";
import { User } from "../users/user.model.js";
import NotificationService from "../notifications/notification.service.js";

export const LoyaltyPartnerService = {
  async getLoyaltyProgramStatus(vendorId) {
    const existing = await LoyaltyPartner.findOne({ vendorId });

    if (!existing) {
      return { status: "not_participated" };
    }

    return {
      status: existing.status,
      application: {
        discountRate: existing.discountRate,
        promoCode: existing.promoCode,
        termsAndConditions: existing.termsAndConditions,
        expiryDate: existing.expiryDate,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      },
    };
  },

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

  async getApprovedLoyaltyPartners() {
    try {
      // Find all loyalty partners with verified status
      const verifiedPartners = await LoyaltyPartner.find({ status: "verified" })
        .populate({
          path: "vendorId",
          select: "name email",
        })
        .select(
          "vendorId discountRate promoCode termsAndConditions expiryDate createdAt"
        )
        .lean();

      // Transform the data to include vendor name
      const partners = verifiedPartners.map((partner) => ({
        vendorId: partner.vendorId._id,
        vendorName: partner.vendorId.name,
        vendorEmail: partner.vendorId.email,
        discountRate: partner.discountRate,
        promoCode: partner.promoCode,
        termsAndConditions: partner.termsAndConditions,
        expiryDate: partner.expiryDate,
        createdAt: partner.createdAt,
      }));

      return partners;
    } catch (error) {
      console.error("Error fetching approved loyalty partners:", error);
      throw new Error("Failed to fetch loyalty partners");
    }
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
