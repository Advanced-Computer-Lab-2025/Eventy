// server/src/features/users/user.admin.route.js
import express from 'express';
import UserController from './user.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';

const router = express.Router();

// GET pending users (admin only)
router.get('/pending', auth, role(['admin']), UserController.getPendingUsers);

// PATCH assign role (admin only)
router.patch('/:id/assign-role', auth, role(['admin']), UserController.assignRole);

export default router;
