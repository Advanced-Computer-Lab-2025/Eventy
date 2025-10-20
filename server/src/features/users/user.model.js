import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      },
    },
    lastName: {
      type: String,
      required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      },
    },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    studentStaffId: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      },
    },

    companyName: {
      type: String,
      required: function () {
        return this.role === "vendor";
      },
    },
    companyLogoUrl: {
      type: String,
    },

    taxCardUrl: {
      type: String,
    },
    role: {
      type: String,
      required: false,
      enum: [
        "student",
        "staff",
        "ta",
        "professor",
        "vendor",
        "admin",
        "events_office",
      ],
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "active", "deleted","blocked"],
      default: "active",
    },

    walletBalance: { type: Number, default: 0 },

    representatives: [
      {
        name: String,
        email: String,
        idCardUrl: String,
      },
    ],

    // ✅ New fields for verification email after the admin verifies their role	"The verification mail should contain a verification link that automatically redirects me to the login page"
    isVerified: { type: Boolean, default: true }, // changed this 
    verificationToken: { type: String },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Add indexes for search performance
userSchema.index({ firstName: 1 }); // Index for firstName search
userSchema.index({ lastName: 1 }); // Index for lastName search
userSchema.index({ firstName: 1, lastName: 1 }); // Compound index for full name search
userSchema.index({ role: 1 }); // Index for role filtering

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
