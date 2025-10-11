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
      required: true,
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

// Ensure a user can only rate an event once
ratingSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
