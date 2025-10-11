import mongoose from "mongoose";
import "../users/user.model.js";

// GymSession Schema

const gymSessionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "yoga",
        "pilates",
        "aerobics",
        "zumba",
        "cross_circuit",
        "kick_boxing",
      ],
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // example: "10:00 AM"
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // trainer/instructor
      required: true,
    },

    maxParticipants: {
      type: Number,
      default: 20, // optional default
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "cancelled", "completed"],
      default: "upcoming",
    },
    deletedAt: {
      type: Date,
      default: null,
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
      required: true,
      enum: ["basketball", "tennis", "football"],
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who booked the court
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const CourtBooking = mongoose.model("CourtBooking", courtBookingSchema);

export { GymSession, CourtBooking };
