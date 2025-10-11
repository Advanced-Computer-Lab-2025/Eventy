const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    certificateUrl: {
      type: String,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true, // ensures each certificate can be verified uniquely
    },
    deletedAt: {
      type: Date,
      default: null, // null means certificate is active
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Certificate", certificateSchema);
