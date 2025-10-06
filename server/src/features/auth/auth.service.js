import { User } from "../users/User.model.js";
import bcrypt from "bcryptjs";
import {
  validateAcademicSignUp,
  validateVendorSignUp,
} from "./auth.validation.js";

export const signUpUser = async (data) => {
  let { role, password, email } = data;

  // Normalize email
  email = email.toLowerCase().trim();
  data.email = email;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("you already have account");
  }

  // Validate
  if (role.toLowerCase() === "vendor") {
    validateVendorSignUp(data);
  } else {
    validateAcademicSignUp(data);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save in MongoDB
  const newUser = new User({ ...data, password: hashedPassword });
  await newUser.save();

  return {
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
  };
};
