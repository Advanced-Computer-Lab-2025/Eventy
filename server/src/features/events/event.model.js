import mongoose from "mongoose";

const { Schema } = mongoose;
const eventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      required: true,
      enum: ["bazaar", "trip", "workshop", "conference", "platform_booth"],
    },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    startTime: { type: String },
    endDate: { type: Date, required: true },
    endTime: { type: String },
    registrationDeadline: { type: Date, required: true },

    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "needs_revision"],
      default: "pending",
    },

    revisionComments: {
      type: String,
      required: function () {
        return this.status === "needs_revision";
      },
      validate: {
        validator: function (value) {
          return (
            this.status !== "needs_revision" ||
            (value && value.trim().length > 0)
          );
        },
        message: "Please mention what needs to be edited",
      },
    },
    attendees: [
      { type: Schema.Types.ObjectId, ref: "User" }, // Students/Staff who registered
    ],

    capacity: { type: Number },

    bannerImage: { type: String }, // URL to the banner image

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // professor or events office/admin
    },

    deletedAt: { type: Date, default: null }, // soft delete,

    price: {
      type: Number,
      required: function () {
        return this.eventType === "trip";
      },
    },
    agenda: {
      type: String,
      required: function () {
        return ["workshop", "conference"].includes(this.eventType);
      },
    },
    requiredBudget: {
      type: Number,
      required: function () {
        return ["workshop", "conference"].includes(this.eventType);
      },
    },
    fundingSource: {
      type: String,
      enum: ["external", "guc"],
      required: function () {
        return ["workshop", "conference"].includes(this.eventType);
      },
      lowercase: true,
    },
    extraResources: { type: String },
    faculty: {
      type: String,
      required: function () {
        return this.eventType === "workshop";
      },
    },
    professors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
          return this.eventType === "workshop";
        },
      },
    ],
    websiteUrl: {
      type: String,
      required: function () {
        return this.eventType === "conference";
      },
    },
  },
  { timestamps: true }
);

// Add indexes for search performance
eventSchema.index({ name: 1 }); // Index for event name search
eventSchema.index({ eventType: 1 }); // Index for event type search
eventSchema.index({ status: 1 }); // Index for status filtering
eventSchema.index({ startDate: 1 }); // Index for date filtering
eventSchema.index({ deletedAt: 1 }); // Index for soft delete filtering
eventSchema.index({ createdBy: 1 }); // Index for createdBy lookup
eventSchema.index({ professors: 1 }); // Index for professors array lookup

// Compound indexes for common query patterns
eventSchema.index({ status: 1, startDate: 1, deletedAt: 1 }); // For upcoming events query
eventSchema.index({ name: "text", description: "text" }); // Text index for name and description search

export const Event = mongoose.model("Event", eventSchema);
