import express from "express";
import { createManagementAccountHandler  } from "./user.controller.js";

const router = express.Router();

// POST /api/admin/users/create-management-account
router.post("/create-management-account", createManagementAccountHandler );

export default router;
