import express from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../utils/constants.js';
import { 
  addToFavorites, 
  getUserFavorites, 
  removeFromFavorites 
} from './favorites.controller.js';
import { 
  addToFavoritesSchema, 
  userIdParamSchema, 
  eventIdParamSchema 
} from './favorites.validation.js';

const router = express.Router({ mergeParams: true });

// Apply authentication and role-based access control middleware
router.use(requireAuth);

// Add to favorites
router.post(
  '/',
  requireRole([ROLES.STUDENT, ROLES.STAFF, ROLES.TA, ROLES.PROFESSOR]),
  validate(addToFavoritesSchema, 'body'),
  validate(userIdParamSchema, 'params'),
  addToFavorites
);

// Get user's favorites
router.get(
  '/',
  requireRole([ROLES.STUDENT, ROLES.STAFF, ROLES.TA, ROLES.PROFESSOR]),
  validate(userIdParamSchema, 'params'),
  getUserFavorites
);

// Remove from favorites
router.delete(
  '/:eventId',
  requireRole([ROLES.STUDENT, ROLES.STAFF, ROLES.TA, ROLES.PROFESSOR]),
  validate(userIdParamSchema, 'params'),
  validate(eventIdParamSchema, 'params'),
  removeFromFavorites
);

export default router;
