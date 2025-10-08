// server/src/features/users/user.admin.route.js
import express from "express";
import UserController from "./user.controller.js";
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
export default router;
