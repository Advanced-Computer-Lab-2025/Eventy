import bcrypt from "bcryptjs";
import { User } from "./user.model.js";

// Service to create admin or events office account
export const createManagementAccount = async (data) => {
  const { firstName, lastName, email, password, role } = data;

  //  Validate role
  if (!["admin", "events_office"].includes(role)) {
    throw new Error("Invalid role. Only admin or events_office accounts can be created using this endpoint.");
  }

  //  Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already exists.");
    error.code = 409; 
    throw error;
  }

  //  Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //  Create user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    status: "active", // directly active
  });

  return newUser;
};
