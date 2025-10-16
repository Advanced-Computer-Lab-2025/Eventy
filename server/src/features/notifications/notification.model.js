import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      }
    ],
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// This ensures the collection is called "notifications"
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
