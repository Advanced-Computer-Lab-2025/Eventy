const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      // rating is optional so users can leave comment-only feedback
      required: false,
    },
    comment: {
      type: String,
    },
    deletedAt: {
      type: Date,
      default: null, // null means rating is active
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// Ensure a user can only rate an event once, but allow multiple comment-only entries.
// We use a partial unique index which enforces uniqueness only when a rating value exists.
// This lets users post multiple comments for the same event, but only one document
// with a rating per (eventId, userId).
ratingSchema.index(
  { eventId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { rating: { $exists: true } } }
);

module.exports = mongoose.model("Rating", ratingSchema);
