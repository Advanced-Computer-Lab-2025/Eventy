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
    description: {
      type: String,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    location: {
      type: String,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    startDate: {
      type: Date,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    endDate: {
      type: Date,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    registrationDeadline: {
      type: Date,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    startTime: {
      type: String,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },
    endTime: {
      type: String,
      required: function () {
        return this.eventType !== "platform_booth";
      },
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "needs_revision", "archived"],
      default: function () {
        // If eventType is 'workshop', default to 'pending', else 'approved'
        return this.eventType === "workshop" ? "pending" : "approved";
      },
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
    // Timestamp when an event was archived by Events Office (null if not archived)
    archivedAt: { type: Date, default: null },
    // Track which Events Office user archived the event
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.archivedAt !== null;
      },
    },
    
    // Array of roles that are restricted from accessing this event
    restrictedRoles: [{
      type: String,
      enum: ["student", "staff", "ta", "professor", "vendor"],
      default: [],
    }],

    price: {
      type: Number,
      required: function () {
        return this.eventType === "trip" || this.eventType === "workshop";
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
    },
    extraResources: { type: String },
    faculty: {
      type: String,
      required: function () {
        return this.eventType === "workshop";
      },
    },
    professors: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: function () {
        return this.eventType === "workshop";
      },
      validate: {
        validator: function (value) {
          return this.eventType !== "workshop" || (value && value.length > 0);
        },
        message: "Workshop must have at least one professor",
      },
      default: undefined,
    },
    websiteUrl: {
      type: String,
      required: function () {
        return this.eventType === "conference";
      },
    },
    // Booth-specific fields
    boothSize: {
      type: String,
      enum: ["2x2", "4x4"],
      required: function () {
        return this.eventType === "platform_booth";
      },
    },
    durationWeeks: {
      type: Number,
      min: 1,
      max: 4,
      required: function () {
        return this.eventType === "platform_booth";
      },
    },
    locationPreference: {
      type: String,
      required: function () {
        return this.eventType === "platform_booth";
      },
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: function () {
        return this.eventType === "platform_booth";
      },
    },
    // timestamps option for mongoose schema
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
eventSchema.index({ archivedAt: 1 }); // Index for archive filtering
eventSchema.index({ archivedBy: 1 }); // Index for archive auditing

// Compound indexes for common query patterns
eventSchema.index({ status: 1, startDate: 1, deletedAt: 1, archivedAt: 1 }); // For upcoming/active events query
eventSchema.index({ archivedAt: 1, archivedBy: 1 }); // For archive auditing queries
eventSchema.index({ name: "text", description: "text" }); // Text index for name and description search
eventSchema.index({ restrictedRoles: 1 }); // Index for checking role restrictions

export const Event = mongoose.model("Event", eventSchema);
