import express from "express";
import { signUp } from "./auth.controller.js";
import { login, logout } from "./auth.controller.js";
import { confirmEmailVerification } from "./auth.service.js"; 
import {verifyStaffByAdmin} from "../users/user.controller.js";


const router = express.Router();

router.post("/signup", signUp);

router.post("/login", login);

router.post("/logout", logout);


router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query; // JWT from email link

    if (!token) {
      return res.status(400).json({ message: "Verification token is missing." });
    }

    // Decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Mark user as verified
    user.status = "active";
    await user.save();

    // Redirect to frontend login page
    res.redirect("http://localhost:3000/login");
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification link." });
  }
});

 
router.patch("/verify/:userId", verifyStaffByAdmin);



export default router;
