import express from "express";
import UserControllerInstance from "./user.controller.js"; 
import role from "../../middlewares/role.middleware.js"; 
import auth from "../../middlewares/auth.middleware.js";

const router = express.Router();

// POST /api/admin/users/create-management-account
router.post(
    "/create-management-account", 
    auth,    // 1. Populates req.user
    role(['admin']), // 2. Checks if req.user.role is 'admin' 
    UserControllerInstance.createManagementAccount
);
export default router;
