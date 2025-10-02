import mongoose from "mongoose";

// GymSession Schema

const gymSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // trainer/instructor
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 20,
    },
    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // users who joined
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "cancelled", "completed"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const GymSession = mongoose.model("GymSession", gymSessionSchema);

// CourtBooking Schema
const courtBookingSchema = new mongoose.Schema(
  {
    courtType: {
      type: String,
      enum: ["tennis", "basketball", "football", "squash", "volleyball"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true, // e.g. "10:00-11:00 AM"
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who booked the court
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // optional, other players
      },
    ],
    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

const CourtBooking = mongoose.model("CourtBooking", courtBookingSchema);

export { GymSession, CourtBooking };
