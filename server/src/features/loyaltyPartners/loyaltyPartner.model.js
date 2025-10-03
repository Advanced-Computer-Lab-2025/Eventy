import mongoose from 'mongoose';

const loyaltyPartnerSchema = new mongoose.Schema(
  {
    vendorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
    },

    vendorName: { type: String, required: true, trim: true }, // can be synced from User model
    
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected', 'cancelled'], 
        default: 'pending' 
    },
    
    loyaltyProgram: {
      discountRate: { type: Number, min: 0, max: 100, required: true },
      promoCode: { type: String, trim: true, required: true, unique: true },
      termsAndConditions: { type: String },
      expiryDate: { type: Date }
    },
    
  },
  { timestamps: true }
);

// Ensure one promo code is unique across all vendors
loyaltyPartnerSchema.index({ promoCode: 1 }, { unique: true });

export const LoyaltyPartner = mongoose.model('LoyaltyPartner', loyaltyPartnerSchema);
