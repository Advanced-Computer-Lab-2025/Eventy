import mongoose from "mongoose";

const loyaltyPartnerSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vendorName: { type: String, required: true, trim: true }, // synced from User model if needed

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "cancelled"],
      default: "pending",
    },

    // loyalty program fields
    discountRate: { type: Number, min: 0, max: 100, required: true },
    promoCode: { type: String, trim: true, required: true, unique: true },
    termsAndConditions: { type: String },
    expiryDate: { type: Date },

    // soft deletion support
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Ensure promo code is unique across all vendors
loyaltyPartnerSchema.index({ promoCode: 1 }, { unique: true });
loyaltyPartnerSchema.index({ vendorId: 1 }, { unique: true });

export const LoyaltyPartner = mongoose.model(
  "LoyaltyPartner",
  loyaltyPartnerSchema
);
