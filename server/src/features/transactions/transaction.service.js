import Stripe from "stripe";
import { Transaction } from "./transaction.model.js";
import { User } from "../users/user.model.js"; // Import User model
import { Event } from "../events/event.model.js"; // Import your Event model
import Application from "../applications/application.model.js"; // Import Application model
import {
  sendPaymentReceipt,
  sendVendorPaymentReceipt,
} from "../auth/email.service.js";

const stripe = new Stripe({
  apiKey: process.env.STRIPE_SECRET_KEY,
});

export class TransactionService {
  async payForEvent({ userId, eventId, paymentMethod }) {
    // Check if user already paid for this event
    const existingTransaction = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });
    if (existingTransaction) {
      throw new Error("You have already paid for this event.");
    }

    // Fetch event and ensure user is registered
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const amount = Number(event.price);
    if (isNaN(amount)) throw new Error("Event price is invalid");

    // --- WALLET PAYMENT ---
    if (paymentMethod === "wallet") {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId, walletBalance: { $gte: amount } },
          { $inc: { walletBalance: -amount } },
          { new: true }
        );

        if (updatedUser) {
          const transaction = await Transaction.create({
            userId,
            type: "payment",
            amount,
            status: "completed",
            paymentMethod: "wallet",
            description: `Payment for event ${event.name}`,
            relatedEntity: { type: "Event", id: eventId },
          });

          return { message: "Payment successful via wallet", transaction };
        } else {
          const userExists = await User.exists({ _id: userId });

          if (!userExists) {
            throw new Error("User not found");
          }

          const user = await User.findById(userId).select("walletBalance");
          if (!user) {
            throw new Error("User not found");
          } else if (user.walletBalance < amount) {
            throw new Error("Insufficient wallet balance");
          } else {
            throw new Error(
              "Failed to debit wallet due to a concurrent update — please try again"
            );
          }
        }
      } catch (err) {
        throw new Error(`Wallet payment failed: ${err.message}`);
      }
    }

    // --- STRIPE PAYMENT ---
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          userId: String(userId),
          eventId: String(eventId),
        },
      });

      const transaction = await Transaction.create({
        userId,
        type: "payment",
        amount,
        status: "pending",
        paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: `Payment for event ${event.name}`,
        relatedEntity: { type: "Event", id: eventId },
      });

      return {
        message: "Stripe payment initiated",
        clientSecret: paymentIntent.client_secret,
        transaction,
      };
    }

    throw new Error("Invalid payment method");
  }

  /**
   * Confirms a Stripe payment intent and updates the transaction status.
   * Also handles wallet top-up confirmation.
   * @param {string} stripePaymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Confirmation message and transaction details
   * @throws {Error} If payment not completed or transaction not found
   */
  async confirmStripePayment(paymentIntentId) {
    // For Stripe Elements, payment is confirmed on the frontend using Stripe.js
    // This endpoint verifies the payment status and updates the transaction
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!transaction) {
      throw new Error("Transaction not found for this payment intent");
    }

    // If payment already succeeded, update transaction and return
    if (paymentIntent.status === "succeeded") {
      // Prevent updating if already completed
      if (transaction.status === "completed") {
        // Ensure application paymentStatus is set to "paid" if needed
        if (transaction.relatedEntity?.type === "Application") {
          const applicationId = transaction.relatedEntity.id;
          await Application.findByIdAndUpdate(applicationId, {
            paymentStatus: "paid",
          });
        }
        return { message: "Payment already confirmed", transaction };
      }

      transaction.status = "completed";
      await transaction.save();
    } else {
      // Payment not yet succeeded - return current status
      return {
        message: `Payment status: ${paymentIntent.status}`,
        status: paymentIntent.status,
        transaction,
      };
    }

    if (transaction.type === "wallet_top_up") {
      const user = await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { walletBalance: transaction.amount } },
        { new: true }
      );

      if (user) {
        sendPaymentReceipt(user.toObject(), transaction, null).catch(
          console.error
        );
        // Passing `null` for event since it's a wallet top-up
      }

      return { message: "Wallet top-up confirmed successfully", transaction };
    }

    if (transaction.type === "payment") {
      // Check if this is an application payment or event payment
      if (transaction.relatedEntity?.type === "Application") {
        // Update application paymentStatus to "paid"
        const applicationId = transaction.relatedEntity.id;
        await Application.findByIdAndUpdate(applicationId, {
          paymentStatus: "paid",
        });

        // Get Stripe receipt URL from the payment intent
        let stripeReceiptUrl = null;
        try {
          // Get the latest charge from the payment intent
          if (paymentIntent.latest_charge) {
            const charge = await stripe.charges.retrieve(
              paymentIntent.latest_charge
            );
            stripeReceiptUrl = charge.receipt_url || null;
          }
        } catch (error) {
          console.error(
            "Error retrieving Stripe receipt URL:",
            error?.message || error
          );
          // Continue without receipt URL - email will still be sent
        }

        // Get vendor and application details for email
        const vendor = await User.findById(transaction.userId).select(
          "email firstName lastName name companyName role"
        );
        const application = await Application.findById(applicationId)
          .populate("event", "name location")
          .populate("createdBy", "companyName");

        // Send vendor payment receipt email (don't await to avoid blocking the response)
        if (vendor && application) {
          sendVendorPaymentReceipt(
            vendor.toObject(),
            transaction,
            application.toObject(),
            stripeReceiptUrl
          ).catch(console.error);
        }

        return {
          message: "Application payment confirmed successfully",
          transaction,
        };
      }
      // Send payment receipt for successful payment
      const userDetails = await User.findById(transaction.userId).select(
        "email firstName lastName name role"
      );
      const event = await Event.findById(transaction.relatedEntity.id);
      if (userDetails && event) {
        sendPaymentReceipt(userDetails.toObject(), transaction, event).catch(
          console.error
        );
      }
      return { message: "Event payment confirmed successfully", transaction };
    }

    return { message: "Payment confirmed", transaction };
  }

  /**
   * Initiates a wallet top-up via Stripe for a user.
   * @param {Object} params
   * @param {string} params.userId - User's ID
   * @param {number} params.amount - Top-up amount
   * @param {string} params.paymentMethod - Payment method ("credit_card", "debit_card")
   * @returns {Promise<Object>} Top-up initiation result and transaction details
   * @throws {Error} If payment method is invalid
   */
  async topUpWallet({ userId, amount, paymentMethod }) {
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          userId: String(userId),
          purpose: "wallet_top_up",
        },
      });

      const transaction = await Transaction.create({
        userId,
        type: "wallet_top_up",
        amount,
        status: "pending",
        paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: "Wallet top-up",
      });

      return {
        message: "Stripe wallet top-up initiated",
        clientSecret: paymentIntent.client_secret,
        transaction,
      };
    }

    throw new Error("Invalid payment method for wallet top-up");
  }
  /**
   * Get all transactions for a given user.
   * @param {String} userId
   * @returns {Promise<Transaction[]>}
   */
  async getUserTransactions(userId) {
    return await Transaction.find({ userId }).sort({ createdAt: -1 });
  }
  /**
   * Calculates the participation fee for a vendor application.
   * For booth: based on duration and location
   * For bazaar: based on location and booth size
   * @param {Object} application - The application document
   * @returns {number} The calculated fee amount
   */
  calculateApplicationFee(application) {
    const baseFee = 50; // Base fee in USD
    let fee = baseFee;

    if (application.type === "booth") {
      // For booth: fee based on duration and location
      // Base fee per week
      const weeklyFee = 25;
      fee = weeklyFee * (application.durationWeeks || 1);

      // Location premium (premium locations cost more)
      // You can customize this logic based on your location preferences
      if (application.locationPreference) {
        const location = application.locationPreference.toLowerCase();
        // Premium locations (e.g., near entrance, high traffic areas)
        if (location.includes("entrance") || location.includes("main")) {
          fee *= 1.5; // 50% premium
        } else if (location.includes("corner") || location.includes("center")) {
          fee *= 1.3; // 30% premium
        }
      }
    } else if (application.type === "bazaar") {
      // For bazaar: fee based on location and booth size
      // Base fee varies by booth size
      if (application.boothSize === "4x4") {
        fee = 100; // Larger booth costs more
      } else {
        fee = 60; // Standard 2x2 booth
      }

      // Location premium for bazaar
      if (application.event) {
        // If event is populated, check event location
        const eventLocation = application.event.location?.toLowerCase() || "";
        if (eventLocation.includes("main") || eventLocation.includes("hall")) {
          fee *= 1.4; // 40% premium for main locations
        }
      }
    }

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Handles payment for a vendor application (bazaar or booth).
   * Prevents duplicate payments and supports Stripe payments only (vendors don't have wallets).
   * Payment must be made within 3 days of application approval.
   * @param {Object} params
   * @param {string} params.userId - Vendor's ID
   * @param {string} params.applicationId - Application's ID
   * @param {string} params.paymentMethod - Payment method ("credit_card", "debit_card")
   * @returns {Promise<Object>} Payment result and transaction details
   * @throws {Error} If already paid, application not found, not approved, payment deadline passed, or invalid payment method
   */
  async payForApplication({ userId, applicationId, paymentMethod }) {
    // Check if vendor already paid for this application
    // Check both transaction status and application paymentStatus
    const existingTransaction = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Application",
      "relatedEntity.id": applicationId,
      status: "completed",
      type: "payment",
    });
    if (existingTransaction) {
      throw new Error("You have already paid for this application.");
    }

    // Fetch the application
    const application = await Application.findById(applicationId)
      .populate("event", "name location")
      .populate("createdBy", "companyName");

    if (!application) {
      throw new Error("Application not found");
    }

    // Verify the application belongs to the vendor
    // Handle both populated and non-populated createdBy
    const createdById = application.createdBy._id || application.createdBy;
    if (createdById.toString() !== userId.toString()) {
      throw new Error("You can only pay for your own applications");
    }

    // Ensure application is approved
    if (application.status !== "approved") {
      throw new Error(
        "You can only pay for approved applications. Current status: " +
          application.status
      );
    }

    // Check if payment has already been made
    if (application.paymentStatus === "paid") {
      throw new Error(
        "Payment has already been completed for this application."
      );
    }

    // Check if payment is within 3 days of approval
    // Use updatedAt as the approval date (when status changed to approved)
    const approvalDate = new Date(application.updatedAt);
    const currentDate = new Date();
    const daysSinceApproval = Math.floor(
      (currentDate - approvalDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceApproval > 3) {
      // Update paymentStatus to "overdue" if deadline has passed
      if (application.paymentStatus !== "overdue") {
        await Application.findByIdAndUpdate(applicationId, {
          paymentStatus: "overdue",
        });
      }

      throw new Error(
        `Payment deadline has passed. The payment deadline was 3 days after approval. ` +
          `Your application was approved ${daysSinceApproval} day${daysSinceApproval > 1 ? "s" : ""} ago. ` +
          `Please contact the events office to proceed.`
      );
    }

    // Calculate the fee
    const amount = this.calculateApplicationFee(application);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Application fee calculation failed");
    }

    // Vendors can only pay via Stripe (credit/debit card) - no wallet option
    if (paymentMethod !== "credit_card" && paymentMethod !== "debit_card") {
      throw new Error(
        "Invalid payment method. Vendors can only pay using credit card or debit card."
      );
    }

    // --- STRIPE PAYMENT ---
    const description =
      application.type === "bazaar"
        ? `Payment for bazaar participation: ${application.event?.name || "Bazaar"}`
        : `Payment for platform booth: ${application.locationPreference || "Booth"}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        userId: String(userId),
        applicationId: String(applicationId),
        purpose: "application_payment",
      },
    });

    const transaction = await Transaction.create({
      userId,
      type: "payment",
      amount,
      status: "pending",
      paymentMethod,
      stripePaymentIntentId: paymentIntent.id,
      description,
      relatedEntity: { type: "Application", id: applicationId },
    });

    return {
      message: "Stripe payment initiated",
      clientSecret: paymentIntent.client_secret,
      transaction,
    };
  }
  /**
   * Refunds a user for a specific event.
   * @param {string} userId - User's ID
   * @param {string} eventId - Event's ID
   * @returns {Promise<Object>} Refund transaction details
   * @throws {Error} If no successful transaction found or wallet not found
   */
  async refundUserForEvent(userId, eventId) {
    // Find successful transaction for that event
    const transaction = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });

    if (!transaction) {
      throw new Error("No successful transaction found for this event.");
    }

    // Always refund to wallet balance
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.walletBalance += transaction.amount;
    await user.save();

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      userId,
      type: "refund",
      amount: transaction.amount,
      status: "completed",
      paymentMethod: "wallet", // Always set to wallet
      description: `Refund for event cancellation (${eventId})`,
      relatedEntity: { type: "Event", id: eventId },
    });

    return refundTransaction;
  }
}
