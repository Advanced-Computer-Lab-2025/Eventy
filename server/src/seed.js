import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './features/users/user.model.js';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventy_db';

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

   

    // Hash password for the users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create users array
    const users = [
      // 3 Office users
     
      {
        firstName: 'Sarah',
        lastName: 'Elsawy',
        email: 'sarah.elsawy@guc.edu.eg',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      },
    ];

    // Insert users into database
    const createdUsers = await User.insertMany(users);
    console.log(`\nSuccessfully created ${createdUsers.length} users:\n`);

    console.log('OFFICE USERS:');
    createdUsers
      .filter(u => u.role === 'office')
      .forEach((user) => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });

    console.log('\nADMIN USERS:');
    createdUsers
      .filter(u => u.role === 'admin')
      .forEach((user) => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });

    console.log('\n✅ All users use password: password123');
    console.log('✅ Admin logins:');
    console.log('   - admin1@guc.edu.eg / password123');
    console.log('   - admin2@guc.edu.eg / password123');
    console.log('✅ Office logins:');
    console.log('   - sarah.office@guc.edu.eg / password123');
    console.log('   - michael.office@guc.edu.eg / password123');
    console.log('   - emily.office@guc.edu.eg / password123\n');

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();