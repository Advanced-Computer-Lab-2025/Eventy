// server/src/features/users/user.admin.route.js
import express from 'express';
import UserController from './user.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';import authMiddleware from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { deleteUserSchema } from './user.validation.js';

const router = express.Router();

// GET pending users (admin only)
router.get('/pending', auth, role(['admin']), UserController.getPendingUsers);

// PATCH assign role (admin only)
router.patch('/:id/assign-role', auth, role(['admin']), UserController.assignRole);

// POST /api/admin/users/create-management-account
router.post(
    "/create-management-account", 
    auth,    // 1. Populates req.user
    role(['admin']), // 2. Checks if req.user.role is 'admin' 
    UserController.createManagementAccount
);

// DELETE /api/admin/users/:id
router.delete(
    "/:id", // The ID of the user to be deleted is a route parameter
    auth, // Authenticate the user
    role(['admin']), // Only Admins are authorized
    validate(deleteUserSchema, 'params'),  // Validate the ID from the route parameters
    UserController.deleteManagementAccount
    
);
export default router;
