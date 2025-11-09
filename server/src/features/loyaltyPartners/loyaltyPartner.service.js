// server/src/features/loyaltyPartner/loyaltyPartner.service.js
import { LoyaltyPartner} from './loyaltyPartner.model.js';
import { User } from '../users/user.model.js';

export const LoyaltyPartnerService = {
  async applyLoyaltyProgram(vendorId, data) {
    // Check if vendor already applied
    const existing = await LoyaltyPartner.findOne({ vendorId });
    if (existing) {
      throw new Error('You have already applied for the loyalty program.');
    }

    // Optionally fetch vendor name from User model
    const vendor = await User.findById(vendorId);
    if (!vendor) throw new Error('Vendor not found.');
        
    const vendorName = vendor.companyName || 'Unknown Vendor';


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
};
