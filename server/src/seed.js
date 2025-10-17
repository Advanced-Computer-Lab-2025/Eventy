import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './features/users/user.model.js';

 // Adjust path as needed

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventy_db';
async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you don't want to delete existing data)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash password for the users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create 3 users with null role
    const users = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: null,
        status: 'pending',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        role: null,
        status: 'pending',
      },
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@example.com',
        password: hashedPassword,
        role: null,
        status: 'pending',
      },
    ];

    // Insert users into database
    const createdUsers = await User.insertMany(users);
    console.log(`Successfully created ${createdUsers.length} users:`);
    createdUsers.forEach((user) => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();