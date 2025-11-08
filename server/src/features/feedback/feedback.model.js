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
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
      maxlength: 1000,
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

// Ensure one feedback per user per event
feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);
