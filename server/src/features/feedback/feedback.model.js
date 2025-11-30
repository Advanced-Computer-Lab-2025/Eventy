import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
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
      required: false,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
      maxlength: 1000,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null, // null means not deleted
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per user per event (only for non-deleted feedback that contains a rating)
feedbackSchema.index(
  { eventId: 1, userId: 1 },
  {
    unique: true,
    name: "rating_unique_per_user_event",
    partialFilterExpression: { deletedAt: null, rating: { $gte: 1 } },
  }
);

export default mongoose.model("Feedback", feedbackSchema);
