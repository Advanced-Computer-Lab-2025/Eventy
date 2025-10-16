// Load environment variables from .env file
import 'dotenv/config'; 

import mongoose from "mongoose";
import User from "./features/users/user.model.js"; // Corrected path for User model
import { Event } from "./features/events/event.model.js"; // 👈 FIXimport Application from "./features/applications/application.model.js"; // Corrected path for Application model
// --- Configuration ---
// These are read directly from the .env file
const MONGODB_URI = process.env.MONGODB_URI; 
// You might also use environment variables for specific user data
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const EVENTSOFFICE_EMAIL = process.env.EVENTSOFFICE_EMAIL || "events.office@example.com";
const USER_EMAIL = process.env.USER_EMAIL || "user@example.com";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "securepassword123";

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in the .env file.");
    process.exit(1);
}

// --- Sample Data ---

const users = [
    { name: "Admin User", email: ADMIN_EMAIL, role: "admin", password: DEFAULT_PASSWORD },
    { name: "Events Office", email: EVENTSOFFICE_EMAIL, role: "eventsOffice", password: DEFAULT_PASSWORD },
    { name: "Regular User", email: USER_EMAIL, role: "user", password: DEFAULT_PASSWORD },
];

const events = [
    { name: "Summer Bazaar 2024", date: new Date("2024-07-01"), location: "Main Hall" },
    { name: "Tech Fair 2024", date: new Date("2024-10-15"), location: "Exhibition Center" },
];

// --- Seeding Function ---

async function seedDB() {
    console.log("Starting database seeding...");

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Connected successfully using MONGODB_URI from .env.");

        // 2. Clear existing data
        await User.deleteMany({});
        await Event.deleteMany({});
        await Application.deleteMany({});
        console.log("Existing data cleared.");

        // 3. Insert Users
        // NOTE: In a real app, you'd HASH these passwords before saving.
        const createdUsers = await User.insertMany(users);
        const adminUser = createdUsers.find(u => u.email === ADMIN_EMAIL);
        const regularUser = createdUsers.find(u => u.email === USER_EMAIL);
        console.log(`Inserted ${createdUsers.length} Users.`);

        // 4. Insert Events
        const createdEvents = await Event.insertMany(events);
        const bazaarEvent = createdEvents[0];
        const boothEvent = createdEvents[1];
        console.log(`Inserted ${createdEvents.length} Events.`);

        // 5. Prepare Applications Data
        const applications = [
            // 🎯 PENDING Application to test status update
            {
                event: bazaarEvent._id,
                type: "bazaar",
                attendees: [{ name: "User Att1", email: "att1@test.com" }],
                boothSize: "2x2",
                status: "pending",
                createdBy: regularUser._id,
            },
            // Approved Booth Application (for context)
            {
                event: boothEvent._id,
                type: "booth",
                attendees: [
                    { name: "User AttA", email: "atta@test.com" },
                    { name: "User AttB", email: "attb@test.com" },
                ],
                boothSize: "4x4",
                durationWeeks: 2,
                locationPreference: "Near Entrance",
                status: "approved",
                createdBy: regularUser._id,
            },
        ];

        // 6. Insert Applications
        const createdApplications = await Application.insertMany(applications);
        const pendingApp = createdApplications[0]; // This is the one to target for update
        console.log(`Inserted ${createdApplications.length} Applications.`);

        // 7. Log necessary IDs for testing
        console.log("\n--- Testing IDs for PATCH /:applicationId/status ---");
        console.log(`Application ID (for testing update): ${pendingApp._id}`);
        console.log(`Admin User Email (role: admin): ${ADMIN_EMAIL}`);
        console.log(`Events Office User Email (role: eventsOffice): ${EVENTSOFFICE_EMAIL}`);
        console.log("\nSeeding complete! 🎉");

    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    } finally {
        // 8. Close the connection
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

seedDB();