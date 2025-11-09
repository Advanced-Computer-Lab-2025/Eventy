// server/src/features/users/user.admin.route.js
import express from "express";
import UserController from "./user.controller.js";
import UserPublicController from "./user.public.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";

const router = express.Router();

// GET pending users (admin only)
router.get(
  "/pending",
  authMiddleware,
  role(["admin"]),
  UserController.getPendingUsers
);

// Public (auth) route to list professors for selection in forms
router.get("/professors", authMiddleware, UserPublicController.getProfessors);

// PATCH assign role (admin only)
router.patch(
  "/:id/assign-role",
  authMiddleware,
  role(["admin"]),
  UserController.assignRole
);

// POST /api/admin/users/create-management-account
router.post(
  "/create-management-account",
  authMiddleware, // 1. Populates req.user
  role(["admin"]), // 2. Checks if req.user.role is 'admin'
  UserController.createManagementAccount
);

// ✅ GET /api/admin/users — List all users
router.get(
  "/getusers",
  authMiddleware,
  role(["admin"]),
  UserController.getAllUsers
);

// PATCH assign role (admin only)
router.patch(
  "/:id/assign-role",
  authMiddleware,
  role(["admin"]),
  UserController.assignRole
);

// DELETE /api/admin/users/:id
router.delete(
  "/:id/delete", // The ID of the user to be deleted is a route parameter
  authMiddleware, // Authenticate the user
  role(["admin"]), // Only Admins are authorized
  UserController.deleteManagementAccount
);

export default router;
