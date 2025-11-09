// server/src/features/loyalty/loyalty.controller.js
import { LoyaltyPartnerService } from './loyaltyPartner.service.js';

export const LoyaltyPartnerController = {
  async apply(req, res) {
    try {
      const vendorId = req.user.id; // assuming JWT middleware adds req.user
      const newApplication = await LoyaltyPartnerService.applyLoyaltyProgram(vendorId, req.body);
      res.status(201).json({
        message: 'Loyalty program application submitted successfully.',
        application: newApplication,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
