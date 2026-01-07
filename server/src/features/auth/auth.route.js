import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js"; // adjust the path if needed

import { signUp } from "./auth.controller.js";
import { login, logout, verifyEmail, refresh } from "./auth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireFrontendBaseUrl } from "../../utils/urls.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh", refresh);

router.get("/me", authMiddleware, async (req, res) => {
  const user = req.user;
  return res.status(200).json({
    user: {
      id: user?._id,
      email: user?.email,
      role: user?.role,
      firstName: user?.firstName,
      lastName: user?.lastName,
      companyName: user?.companyName,
      walletBalance: user?.walletBalance,
    },
  });
});

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
    const frontendBaseUrl = requireFrontendBaseUrl(
      "email verification redirect"
    );
    res.redirect(`${frontendBaseUrl}/login`);
  } catch {
    res.status(400).json({ message: "Invalid or expired verification link." });
  }
});

export default router;
