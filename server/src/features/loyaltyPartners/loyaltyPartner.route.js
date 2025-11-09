// server/src/features/loyaltyPartner/loyaltyPartner.routes.js
import express from 'express';
import { LoyaltyPartnerController } from './loyaltyPartner.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';

const router = express.Router();

// POST /api/loyaltyPartner/apply
router.post(
  '/apply',
  authMiddleware,
  role(['vendor']),
  LoyaltyPartnerController.apply
);

export default router;
