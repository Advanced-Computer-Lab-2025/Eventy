import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./features/users/user.model.js"; // adjust the path if different
import { Event } from "./features/events/event.model.js"; // adjust the path if different

dotenv.config();

async function seedData() {
  try {
    // connect to DB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // 1. Create a dummy professor
    const professor = await User.create({
      firstName: "Sara",
      lastName: "Elsawy",
      email: "sara.professor@guc.edu.eg",
      password: "test1234", // ⚠️ plain text for now
      role: "professor",
      studentStaffId: "P12345",
      status: "active"
    });

    console.log("👩‍🏫 Professor created:", professor._id);

    // 2. Create a dummy workshop by this professor
    const workshop = await Event.create({
      name: "AI Workshop for Beginners",
      eventType: "workshop",
      description: "Introductory workshop on AI basics",
      location: "GUC Cairo",
      startDate: new Date("2025-10-10T10:00:00Z"),
      endDate: new Date("2025-10-10T12:00:00Z"),
      registrationDeadline: new Date("2025-10-09T23:59:59Z"),
      createdBy: professor._id,
      faculty: "IET",
      professors: [professor._id],
      agenda: "Intro, demos, Q&A",
      requiredBudget: 2000,
      fundingSource: "guc",
      status: "pending" // professor submits → starts as pending
    });

    console.log("📚 Workshop created:", workshop._id);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
