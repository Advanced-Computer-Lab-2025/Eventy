import mongoose from "mongoose";

const feedbackCommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

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
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: false,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["rating", "comment", "rating_and_comment"],
      required: true,
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

// Ensure one feedback per user per event (only for non-deleted feedback)
feedbackSchema.index(
  { eventId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

export default mongoose.model("Feedback", feedbackSchema);
