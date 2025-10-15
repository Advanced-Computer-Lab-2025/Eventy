import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Event } from "../features/events/event.model.js"; // ✅ Use your existing Event model

// 🧭 Resolve .env path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("🧭 MONGO_URI:", process.env.MONGO_URI);

async function seedWorkshops() {
  try {
    // ✅ Connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🧹 Remove existing workshops
    await Event.deleteMany({ eventType: "workshop" });
    console.log("🧹 Cleared old workshops");

    // 👨‍🏫 Professor ID (from your message)
    const professorId = "68eeb39fb11a8f8239eca370";

    // 🌱 Create workshop events
    const workshops = [
      {
        name: "AI in Modern Education",
        eventType: "workshop",
        description: "A hands-on workshop exploring AI applications in education.",
        location: "GUC Hall 3",
        startDate: new Date("2025-12-05"),
        endDate: new Date("2025-12-05"),
        registrationDeadline: new Date("2025-12-01"),
        status: "pending",
        faculty: "Media Engineering and Technology",
        agenda: "Introduction to AI, Applications, and Interactive Demos",
        requiredBudget: 5000,
        fundingSource: "guc",
        createdBy: professorId,
        professor: professorId
      },
      {
        name: "Sustainable Energy Workshop",
        eventType: "workshop",
        description: "A deep dive into renewable energy innovations.",
        location: "GUC Seminar Room A",
        startDate: new Date("2025-12-10"),
        endDate: new Date("2025-12-11"),
        registrationDeadline: new Date("2025-12-05"),
        status: "pending",
        faculty: "Engineering",
        agenda: "Solar, Wind, and Future Energy Systems",
        requiredBudget: 7000,
        fundingSource: "external",
        createdBy: professorId,
        professor: professorId
      },
    ];

    await Event.insertMany(workshops);
    console.log("🌱 Seeded workshops successfully!");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding workshops:", err);
    process.exit(1);
  }
}

seedWorkshops();
