import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../features/users/user.model.js"; // adjust the path if needed
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourDBName";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existingAdmin = await User.findOne({ email: "admin1@guc.edu.eg" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "System Admin",
      email: "admin1@guc.edu.eg",
      password: hashedPassword,
      role: "admin", // 👈 important
    });

    await admin.save();
    console.log("🎉 Admin user created successfully!");
    console.log("Login credentials:");
    console.log("📧 Email: admin1@guc.edu.eg");
    console.log("🔑 Password: Admin@123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();
