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
      enum: ["credit_card", "wallet", "debit_card"], // Added "debit_card"
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

//reason of removal:
//i need to allow updates to transactions in case of payment failures or refunds
//i need to be able to update the status of a transaction from 'pending' to 'completed' or 'failed'

export const Transaction = mongoose.model("Transaction", transactionSchema);
