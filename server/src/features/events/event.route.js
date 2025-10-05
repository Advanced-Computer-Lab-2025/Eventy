import express from 'express';
import { createTrip } from './event.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';

const router = express.Router();

// POST /api/admin/trips
router.post(
  '/admin/trips',
  auth,
  role(['admin', 'events_office']),
  createTrip
);

export default router;
