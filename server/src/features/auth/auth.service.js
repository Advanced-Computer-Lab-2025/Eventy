import { User } from "../users/user.model.js";
import bcrypt from "bcryptjs";
import {
  validateAcademicSignUp,
  validateVendorSignUp,
} from "./auth.validation.js";
import jwt from "jsonwebtoken";

export const signUpUser = async (data) => {
  const { role } = data;

  // ✅ Check if role exists before calling toLowerCase()
  if (!role) {
    throw new Error("Role is required");
  }

  // ✅ Step 1: Normalize role
  const normalizedRole = role.toLowerCase();

  // ✅ Step 2: Validate based on role
  if (["student", "staff", "ta", "professor"].includes(normalizedRole)) {
    validateAcademicSignUp(data);
  } else if (normalizedRole === "vendor") {
    validateVendorSignUp(data);
  } else {
    throw new Error(
      "Invalid role. Only students, staff, TAs, professors, and vendors can sign up."
    );
  }

  // ✅ Step 3: Check for duplicate email
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new Error("This email is already registered.");

  // ✅ Step 4: Additional duplicate checks
  if (["student", "staff", "ta", "professor"].includes(normalizedRole)) {
    const existingId = await User.findOne({
      studentStaffId: data.studentStaffId,
    });
    if (existingId) throw new Error("This ID is already registered.");
  } else if (normalizedRole === "vendor") {
    const existingCompany = await User.findOne({
      companyName: data.companyName,
    });
    if (existingCompany)
      throw new Error("A company with this name already exists.");
  }

  // ✅ Step 5: Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // ✅ Step 5.5: Determine initial verification status
  let status = "active"; // default for student/vendor
  if (["staff", "ta", "professor"].includes(normalizedRole)) {
    status = "pending"; // requires admin approval + email verification
  }

  // ✅ Step 6: Build user data
  const isAcademic = ["staff", "ta", "professor"].includes(normalizedRole);

  const userData = {
    ...data,
    password: hashedPassword,
    status,
    isVerified: isAcademic ? false : true,
    roleVerifiedByAdmin: false,
    role: isAcademic ? null : normalizedRole,
  };

  // ✅ Step 7: Create and save user
  const user = new User(userData);
  await user.save();

  // ✅ Step 8: Prepare clean response
  if (["student"].includes(normalizedRole)) {
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

  if (["staff", "ta", "professor"].includes(normalizedRole)) {
    return {
      message:
        status === "pending"
          ? `Account created successfully! Please wait for admin verification.`
          : `Welcome ${user.firstName}! 🎉 Your ${user.role} account has been created successfully.`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
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

export const loginUser = async (data) => {
  let { email, password } = data;

  // ✅ Step 0: Validate input fields exist
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // ✅ Step 1: Normalize email safely
  const normalizedEmail = email.toLowerCase().trim();

  // ✅ Step 2: Find the user by normalized email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("No account found with this email.");
  }

  // ✅ Step 3: GUC email check (for non-vendor users)
  if (
    user.role !== "vendor" &&
    !(
      //      normalizedEmail.endsWith("@gmail.com") ||
      (
        normalizedEmail.endsWith("@guc.edu.eg") ||
        normalizedEmail.endsWith("@student.guc.edu.eg")
      )
    )
  ) {
    throw new Error("Please use your GUC email to log in.");
  }

  // ✅ Step 3.5: Ensure verified before login (NEW REQUIREMENT)
  if (
    ["staff", "ta", "professor"].includes(user.role.toLowerCase()) &&
    user.status !== "active"
  ) {
    throw new Error(
      "Your account has not been verified yet. Please check your email for the verification link."
    );
  }

  // ✅ Step 4: Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid password. Please try again.");
  }

  // ✅ Step 5: Create JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "30d" }
  );

  // ✅ Step 6: Personalized welcome message
  let welcomeMessage = `Welcome back, ${user.firstName || "User"}!`;
  if (user.role === "vendor")
    welcomeMessage = `Welcome back, ${user.companyName || "Vendor"}!`;

  return {
    message: welcomeMessage,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      companyName: user.companyName,
    },
    token,
  };
};

/**
 * LOGOUT FUNCTION
 * Simply invalidates token on frontend (no DB storage needed here)
 */
export const logoutUser = async () => {
  // In JWT, logout is handled on client side by removing token.
  return { message: "Logged out successfully." };
};

export const confirmEmailVerification = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) throw new Error("User not found");

    user.isVerified = true;
    user.status = "active"; // Update status to active
    await user.save();

    return { message: "Email verified successfully" };
  } catch (error) {
    throw new Error("Invalid or expired verification link");
  }
};
