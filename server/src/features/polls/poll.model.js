import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  optionText: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // stores user IDs that voted
});

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [optionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Polls that resolve conflicts between multiple booth applications
    relatedApplications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    // Optional metadata about the context of the poll (e.g. booth location)
    context: {
      locationPreference: { type: String },
      durationWeeks: { type: Number },
      type: { type: String },
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }, // soft delete / manual end timestamp
  },
  { timestamps: true } // this auto-adds createdAt & updatedAt
);

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
