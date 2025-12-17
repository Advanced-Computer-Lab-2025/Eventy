import express from "express";
import { getRecommendations } from "./recommendation.controller.js";
import verifyToken from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getRecommendations);
// Reset endpoint disabled during testing to avoid accidental data loss
// router.post("/reset", verifyToken, resetRecommendations);

export default router;
