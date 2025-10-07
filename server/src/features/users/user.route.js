// server/src/features/users/user.admin.route.js
import express from 'express';
import UserController from './user.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

// GET pending users (admin only)
router.get('/pending', auth, role(['admin']), UserController.getPendingUsers);

// POST /api/admin/users/create-management-account
router.post(
    "/create-management-account", 
    auth,    // 1. Populates req.user
    role(['admin']), // 2. Checks if req.user.role is 'admin' 
    UserController.createManagementAccount
);


// ✅ GET /api/admin/users — List all users
router.get("/getusers", auth, role(["admin"]), UserController.getAllUsers);

// PATCH assign role (admin only)
router.patch('/:id/assign-role', auth, role(['admin']), UserController.assignRole);

// DELETE /api/admin/users/:id
router.delete(
    "/:id/delete", // The ID of the user to be deleted is a route parameter
    auth, // Authenticate the user
    role(['admin']), // Only Admins are authorized
    UserController.deleteManagementAccount
);

export default router;
