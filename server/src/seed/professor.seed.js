import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {User} from "../features/users/user.model.js"; // ✅ Adjusted import

// ✅ Fixes path issue when running from subfolder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ✅ Log to confirm
console.log("MONGO_URI:", process.env.MONGO_URI);

async function seedProfessors() {
  try {
    // ✅ Connect using env variable
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear previous professors
    await User.deleteMany({ role: "professor" });
    console.log("🧹 Cleared old professors");

    // Create dummy professors
    const professors = [
      {
        firstName: "Omar",
        lastName: "Khaled",
        email: "omar.khaled@guc.edu.eg",
        password: "Password123!",
        studentStaffId: "P1001",
        role: "professor",
      },
      {
        firstName: "Sara",
        lastName: "Elmansy",
        email: "sara.elmansy@guc.edu.eg",
        password: "Password123!",
        studentStaffId: "P1002",
        role: "professor",
      },
    ];

    await User.insertMany(professors);
    console.log("🌱 Seeded professors successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding professors:", err);
    process.exit(1);
  }
}

seedProfessors();
