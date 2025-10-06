import express from "express";
import { authAdmin } from "./firebaseAdmin.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email.endsWith("@guc.edu.eg")) {
    return res.status(400).json({ message: "Only university emails allowed" });
  }

  try {
    const userRecord = await authAdmin.createUser({
      email,
      password,
    });

    res.status(201).json({ message: "User created", uid: userRecord.uid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
