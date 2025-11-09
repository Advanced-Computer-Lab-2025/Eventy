import express from 'express';
import { LoyaltyPartnerController } from './loyaltyPartner.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { applyLoyaltyProgramSchema } from './loyaltyPartner.validation.js';


const router = express.Router();


// POST /api/loyaltyPartner/apply
router.post(
  '/apply',
  authMiddleware,
  role(['vendor']),
  validate(applyLoyaltyProgramSchema),
  LoyaltyPartnerController.apply
);

export default router;
