import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bazaarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    boothSize: {
      type: String,
      enum: ["2x2", "4x4"],
      required: true,
    },
    durationWeeks: {
      type: Number,
      required: true,
    },
    locationPreference: {
      type: String,
    },
    staff: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        id: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
      required: true,
    },
    qrCodeUrl: {
      type: String,
    },
    deletedAt: {
      type: Date,
      default: null, // null means application is active
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

const Application = mongoose.model("Application", applicationSchema);
export default Application;
