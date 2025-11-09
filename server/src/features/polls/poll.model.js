const mongoose = require("mongoose");

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
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }, // soft delete
  },
  { timestamps: true } // this auto-adds createdAt & updatedAt
);

module.exports = mongoose.model("Poll", pollSchema);
