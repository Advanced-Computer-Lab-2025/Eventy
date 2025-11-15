import { LoyaltyPartner } from "./loyaltyPartner.model.js";
import { User } from "../users/user.model.js";

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
    // Check if vendor already applied
    const existing = await LoyaltyPartner.findOne({ vendorId });
    if (existing) {
      const err = new Error(
        "You have already applied for the loyalty program."
      );
      err.statusCode = 409;
      throw err;
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
      status: { $in: ["pending", "verified"] },
    });

    if (!existing) {
      const err = new Error("No active loyalty program found to cancel.");
      err.statusCode = 404;
      throw err;
    }

    // Update status to cancelled
    existing.status = "cancelled";
    existing.deletedAt = new Date();

    await existing.save();

    return {
      message: "Successfully cancelled loyalty program participation",
      cancelledAt: existing.deletedAt,
    };
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
};
