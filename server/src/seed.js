import logger from "./utils/logger.js";
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./features/users/user.model.js";

const MONGODB_URI =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === "production"
    ? undefined
    : "mongodb://localhost:27017/eventy_db");

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGO_URI. Set MONGO_URI in the environment before running the seed script."
  );
}

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");

    // Hash password for the users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create users array
    const users = [
      // 3 Office users

      {
        firstName: "Sarah",
        lastName: "Elsawy",
        email: "sarah.elsawy@guc.edu.eg",
        password: hashedPassword,
        role: "admin",
        status: "active",
      },
    ];

    // Insert users into database
    const createdUsers = await User.insertMany(users);
    logger.info(`\nSuccessfully created ${createdUsers.length} users:\n`);

    logger.info("OFFICE USERS:");
    createdUsers
      .filter((u) => u.role === "office")
      .forEach((user) => {
        logger.info(
          `  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`
        );
      });

    logger.info("\nADMIN USERS:");
    createdUsers
      .filter((u) => u.role === "admin")
      .forEach((user) => {
        logger.info(
          `  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`
        );
      });

    logger.info("\n✅ All users use password: password123");
    logger.info("✅ Admin logins:");
    logger.info("   - admin1@guc.edu.eg / password123");
    logger.info("   - admin2@guc.edu.eg / password123");
    logger.info("✅ Office logins:");
    logger.info("   - sarah.office@guc.edu.eg / password123");
    logger.info("   - michael.office@guc.edu.eg / password123");
    logger.info("   - emily.office@guc.edu.eg / password123\n");

    // Close the connection
    await mongoose.connection.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
