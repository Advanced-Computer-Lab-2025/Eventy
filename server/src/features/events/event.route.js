import express from 'express';
import eventController from './event.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

const router = express.Router();

router.post(
  '/bazaars',
  authMiddleware,                 // verifies JWT (mock for now)
  roleMiddleware('EventsOffice'), // only EventsOffice can access
  eventController.createBazaar    // controller we created
);

export default router;
