import express from "express";
import { createManagementAccount } from "./user.controller.js";

const router = express.Router();

// POST /api/users/create-management
router.post("/create-management-account", createManagementAccount);

export default router;
