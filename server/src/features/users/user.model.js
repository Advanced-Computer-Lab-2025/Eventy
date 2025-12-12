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
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },

    studentStaffId: {
      type: String,
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
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
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
    // Track viewed events for recommendations
    viewedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    status: {
      type: String,
      required: true,
      enum: ["pending", "active", "deleted", "blocked"],
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

    // Store favorite events for students, staff, TAs, and professors
    favoriteEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        default: [],
      },
    ],
    googleCalendarTokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    calendarConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add indexes for search performance
userSchema.index({ firstName: 1 }); // Index for firstName search
userSchema.index({ lastName: 1 }); // Index for lastName search
userSchema.index({ firstName: 1, lastName: 1 }); // Compound index for full name search
userSchema.index({ role: 1 }); // Index for role filtering
// Unique email ONLY when status is not "deleted"
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "deleted" } },
  }
);

// Unique studentStaffId ONLY when status is not "deleted"
userSchema.index(
  { studentStaffId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { status: { $ne: "deleted" } },
  }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
