import express from "express";
import {
  getRecommendations,
  resetRecommendations,
} from "./recommendation.controller.js";
import verifyToken from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getRecommendations);
router.post("/reset", verifyToken, resetRecommendations);

export default router;
