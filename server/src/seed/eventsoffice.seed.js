import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { User } from "../features/users/user.model.js"; // adjust the path

// 🧭 Resolve .env path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seedEventsOffice() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // ✅ Remove existing Events Office users (optional)
    await User.deleteMany({ role: "events_office" });
    console.log("🧹 Cleared old Events Office accounts");

    // ✅ Hash the password
    const plainPassword = "test123"; // <-- choose your password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // ✅ Create new Events Office user
    const newUser = new User({
      email: "events.office@guc.edu.eg",
      password: hashedPassword,
      role: "events_office",
      status: "active",
      walletBalance: 0,
      isVerified: true,
      deletedAt: null,
      representatives: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newUser.save();
    console.log("🌱 Events Office account seeded successfully!");
    console.log("Email:", newUser.email);
    console.log("Password:", plainPassword);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding Events Office:", err);
    process.exit(1);
  }
}

seedEventsOffice();
