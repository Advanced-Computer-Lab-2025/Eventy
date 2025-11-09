import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js"; // adjust the path if needed

import { signUp } from "./auth.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { login, logout, verifyEmail } from "./auth.controller.js";

const router = express.Router();

// Configure multer storage for signup file uploads (logo & tax card)
const signupUploadsDir = path.join(process.cwd(), "uploads", "id-cards");
if (!fs.existsSync(signupUploadsDir)) {
  fs.mkdirSync(signupUploadsDir, { recursive: true });
}

const signupStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, signupUploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const signupUpload = multer({
  storage: signupStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Accept optional fields companyLogo and taxCard when vendor signs up
router.post(
  "/signup",
  signupUpload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
  ]),
  signUp
);

router.post("/login", login);

router.post("/logout", logout);

router.get("/verify-email/:token", verifyEmail);

router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query; // JWT from email link

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is missing." });
    }

    // Decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey"
    );

    // Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.status = "active"; // optional: activate the account
    await user.save();

    // Redirect to frontend login page
    res.redirect("http://localhost:5000/login");
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification link." });
  }
});

export default router;
