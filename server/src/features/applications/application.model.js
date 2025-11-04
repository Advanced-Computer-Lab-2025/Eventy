import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  individualID: { type: String, required: true }, // URL to uploaded ID card image for this attendee
});

const applicationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",

    },
    type: {
      type: String,
      enum: ["bazaar", "booth"],
      required: true,
    },
    attendees: {
      type: [attendeeSchema],
      validate: [
        (arr) => arr.length > 0 && arr.length <= 5,
        "Must have 1-5 attendees",
      ],
    },
    boothSize: {
      type: String,
      enum: ["2x2", "4x4"],
      required: true,
    },
    durationWeeks: { type: Number, min: 1, max: 4 }, // Only for booth
    locationPreference: { type: String }, // Only for booth
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);