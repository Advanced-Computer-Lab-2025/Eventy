import mongoose from "mongoose";

const { Schema } = mongoose;

const waitlistSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    autopayEnabled: {
      type: Boolean,
      default: false,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    // Track when user was notified (if applicable)
    notifiedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate waitlist entries
waitlistSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for querying waitlist by event
waitlistSchema.index({ event: 1, deletedAt: 1 });

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
