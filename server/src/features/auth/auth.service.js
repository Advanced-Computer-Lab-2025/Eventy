import { User } from "../users/User.model.js";
import bcrypt from "bcryptjs";
import {
  validateAcademicSignUp,
  validateVendorSignUp,
} from "./auth.validation.js";

export const signUpUser = async (data) => {
  const { role } = data;

  // ✅ Step 1: Normalize role
  const normalizedRole = role.toLowerCase();

  // ✅ Step 2: Validate based on role
  if (["student", "staff", "ta", "professor"].includes(normalizedRole)) {
    validateAcademicSignUp(data);
  } else if (normalizedRole === "vendor") {
    validateVendorSignUp(data);
  } else {
    throw new Error("Invalid role. Only students, staff, TAs, professors, and vendors can sign up.");
  }

  // ✅ Step 3: Check for duplicate email
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new Error("This email is already registered.");

  // ✅ Step 4: Additional duplicate checks
  if (["student", "staff", "ta", "professor"].includes(normalizedRole)) {
    const existingId = await User.findOne({ studentStaffId: data.studentStaffId });
    if (existingId) throw new Error("This Student/Staff ID is already registered.");
  } else if (normalizedRole === "vendor") {
    const existingCompany = await User.findOne({ companyName: data.companyName });
    if (existingCompany) throw new Error("A company with this name already exists.");
  }

  // ✅ Step 5: Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // ✅ Step 6: Build user data
  const userData = {
    ...data,
    password: hashedPassword,
    status: "active",
  };

  // ✅ Step 7: Create and save user
  const user = new User(userData);
  await user.save();

  // ✅ Step 8: Prepare clean response
  if (["student", "staff", "ta", "professor"].includes(normalizedRole)) {
    return {
      message: `Welcome ${user.firstName}! 🎉 Your ${user.role} account has been created successfully.`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  if (normalizedRole === "vendor") {
    return {
      message: `Welcome ${user.companyName}! 🏢 Your vendor account has been created successfully.`,
      user: {
        _id: user._id,
        companyName: user.companyName,
        email: user.email,
        role: user.role,
      },
    };
  }
};
