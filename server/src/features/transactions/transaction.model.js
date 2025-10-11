import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["payment", "refund", "wallet_top_up"],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["credit_card", "wallet"],
    },

    description: {
      type: String,
      trim: true,
    },

    relatedEntity: {
      type: {
        type: String,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    stripePaymentIntentId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure immutability of transactions (no updates allowed after creation)
transactionSchema.pre("findOneAndUpdate", function (next) {
  return next(
    new Error("Transactions are immutable and cannot be updated.")
  );
});

transactionSchema.pre("updateOne", function (next) {
  return next(
    new Error("Transactions are immutable and cannot be updated.")
  );
});

transactionSchema.pre("deleteOne", function (next) {
  return next(
    new Error("Transactions are immutable and cannot be deleted.")
  );
});

transactionSchema.pre("remove", function (next) {
  return next(
    new Error("Transactions are immutable and cannot be removed.")
  );
});

export const Transaction = mongoose.model("Transaction", transactionSchema);