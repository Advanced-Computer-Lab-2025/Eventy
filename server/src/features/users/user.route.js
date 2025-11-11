// server/src/features/users/user.admin.route.js
import express from "express";
import UserController from "./user.controller.js";
import UserPublicController from "./user.public.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// PATCH /api/users/me - update current user's profile
// Allow vendors to upload company logo and tax card when updating profile
const profileUploadsDir = path.join(process.cwd(), "uploads", "id-cards");
if (!fs.existsSync(profileUploadsDir))
  fs.mkdirSync(profileUploadsDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileUploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.patch(
  "/me",
  authMiddleware,
  profileUpload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
  ]),
  UserController.updateProfile
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
